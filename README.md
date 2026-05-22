# d | mrkt indexer

A component of the web3 demo; `d | mrkt`.

It's an indexer that:

- Ingests signed EIP-172 orders and on-chain events
- Stores normalized marketplace state in MongoDB
- Exposes REST + realtime feeds for consumers

> [!WARNING]
> Not production ready.

**Contents** — [Overview](#overview) · [Prerequisites](#prerequisites) · [Run](#run) · [Web3 layer](#web3-layer) · [Architecture](#architecture) · [Data Flow](#data-flow) · [Reference](#reference) · [Future improvements](#future-improvements)

For routes, events, and query formats — see [Reference](#reference):

- [API](#api-1)
- [WebSocket events](#websocket-events)

---

## Overview

Indexer is at version v.0, ready for demo purposes. It's built around a specific marketplace contract, available [here](https://github.com/izcm/dmrkt-contracts/blob/main/contracts/orderbook/OrderEngine.sol). The architecture is designed to handle multiple chains.

**Ingestion**

Signed EIP-712 orders are ingested via POST, and on-chain events — `Settlement` and `OrderCancelled` — are picked up by log listeners subscribed to the RPC.

When an order or settlement is ingested the address in its collection field is noted, and stored to DB if not already there. Here it will be enriched with additional metadata, which is fetched from periodic background workers.

**Workers**

Background workers periodically enrich and expand stored data.

For example, workers fetch NFT metadata and backfill NFTs from historical `Transfer` events.

A record that hasn't been enriched yet is still queryable through the API.

**API**

The API is minimal. Query routes each expose a by-key and a pagination endpoint. These endpoints exist for every domain model.

One POST route accepts signed orders for ingestion.

There are currently no auth mechanisms, anyone can read data and post orders. Query parameters and POST bodies are validated / whitelisted through JSON schemas.

---

## Prerequisites

An `OrderEngine` contract must be deployed per chain. Deployment is straightforward, [repo](https://github.com/izcm/dmrkt-contracts) `README` explains how.

RPC URLs and contract addresses are configured in `chains.json` — see `chains.example.json` for the expected shape.

> [!IMPORTANT]
> If `marketplaceAddr` doesn't point to a deployed `OrderEngine`, the indexer will run fine but never pick up any events.

### Dependencies

| Tool   | Version | Notes                            |
| ------ | ------- | -------------------------------- |
| Node   | ≥ 22    |                                  |
| Docker | \_\_\_  | MongoDB & Anvil runs via compose |

### Environment variables

| VAR                | Description                              | Required | Example                     |
| ------------------ | ---------------------------------------- | -------- | --------------------------- |
| `MONGODB_URI`      | MongoDB connection string                | Yes      | `mongodb://localhost:27017` |
| `DB_NAME`          | MongoDB database name                    | Yes      | `dmrkt`                     |
| `CHAINS_CONFIG`    | Path to chains.json                      | No       | `./chains.json`             |
| `FORK_START_BLOCK` | Block used as starting point for polling | No       | `21000000`                  |

If `FORK_START_BLOCK` is not set, polling starts at the genesis block.

---

## Run

The `docker-compose` in repo root builds two containers:

1. `anvil`: local Ethereum node
2. `mongo`: local MongoDB instance

Spin up containers:

```bash
docker compose up --build
```

> Omit `--build` to reuse previously built images and speed up startup.

When containers are up, run the indexer:

```bash
npm run dev
```

To stop and remove containers:

```bash
docker compose down
```

---

## Web3 layer

### Multichain

Chain configuration lives in `chains.json` — an array of `{ rpcUrl, marketplaceAddr }` objects, one per chain. On boot, the indexer creates one viem client per entry and starts listeners and workers across all of them.

Each RPC is queried for its chain-id. Code throws if the URL doesn't point to a valid RPC or if the response chain-id is not found in `viem/chains`.

All domain models are scoped by `chainId`, so multiple chains share the same database without collision.

### Token standards

NFT collections get noted as orders and settlements are ingested. For example, when ingesting an order for token #5 in collection `0xabc`, that collection address gets noted.

> “Noted” means the address is ensured to exist in the database.

Collection addresses are persisted without token-standard validation, so any address can be stored.

Since enrichment and NFT backfill currently only support ERC-721, non-ERC-721 collections will end up stale.

### EIP-712

Orders are submitted off-chain as EIP-712 typed-data signatures.

The EIP-712 setup here mirrors `OrderEngine` contract — same typed-data fields, field order, and hashing logic.

The typed payload maps directly to the on-chain `Order` struct:

```solidity
struct Order {
  Side side;              // 0 = ask, 1 = bid
  bool isCollectionBid;
  address collection;
  uint256 tokenId;        // ignored if isCollectionBid = true
  address currency;
  uint256 price;
  address actor;
  uint64 start;
  uint64 end;
  uint256 nonce;
}
```

---

## Architecture

```txt
api        -> routes
domain     -> resources definitions and shared types
read       -> intermediate reading layer and DTO transforms
repos      -> from / to db
listeners  -> blockchain events
workers    -> background jobs
di         -> startup wiring
```

The design choices made are DDD-inspired, focus being on _framework as a detail_ rather than ensuring perfect DDD architecture.

### API

Built with Fastify. Query params and POST bodies are validated through JSON schemas.

API is minimal, each data model has two query routes:

| Route  | Description                   |
| ------ | ----------------------------- |
| `/:id` | reads a single resource by id |
| `/`    | read a page                   |

Only `Order` records are ingested through the API.

```
api/
├── routes/
│   ├── orders/
│   │   ├── ingest.ts        POST /api/orders
│   │   ├── query.ts         GET  /api/orders, /api/orders/:id
│   │   └── schemas.ts       model specific validation schemas
│   ├── ...other models
│   └── healthcheck.ts       liveness check
└── shared/
    ├── schemas.ts           shared validation schemas
    ├── build-page-query.ts  maps query params → PageQuery
    └── get-or-404.ts        fetches a record by key, returns 404 if not found
```

The imported read methods are wired at startup – see [Dependency injection](#dependency-injection).

> [!NOTE]
> Available query parameters, `id` formats, response shapes, and `Order` POST body example are given in the [API reference](#api-1)

### Domain

This domain can be thought of as an empty apartment complex:

- apartments: the domain models (`order`, `settlement`, `nft`, `nftCollection`)
- doors: how data enters, any rules on its form, and any effects of its entry
- windows: how data is read

But no furniture – its decoupled from all frameworks.

The project uses the term “Resource” when referring to the complete representation of a model — not just its shape, but also its key type, ports, relations, DTO transforms, and read behavior.

Each resource in the domain follows the same structure:

| File         | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `model.ts`   | types and shape of the resource                                 |
| `port.ts`    | interface for persistence — what the repo must implement        |
| `actions.ts` | what happens when something occurs — orchestrates ports         |
| `rules.ts`   | pure validation logic, eg. order timestamps are in unix seconds |

Though each resource doesn't have to implement all of the above.

**Actions**

The resource `actions` contain the definitions for what to do when some part of the indexer, whether API or listener, wants to persist data to DB.

It doesn't depend on any frameworks, nor any code outside domain – these are injected at startup.

They simply explain the flow for doing some sort of write,

**ResourceMap**

`resource.ts` defines the resource registry, a mapping between a resource's string name to their respective type and key (unique id).

The snippet below is a composed example showing a typical use of the resource registry.

```ts
const RESOURCE_NAMES = ['settlement', 'order', 'nftCollection', 'nft'] as const

type ResourceName = (typeof RESOURCE_NAMES)[number]
type ResourceType<R extends ResourceName> = ResourceMap[R]['type']

// maps resource names to their associated types
// allows generic functions to resolve the correct key + model types
type ResourceMap = {
  order: {
    type: OrderRecord
    key: OrderKey
  }
  // ...
}

// dto transform at `read-layer`
const dtos: { [R in ResourceName]: (x: ResourceType<R>) => any } = {
  order: toOrderDTO,
  // ...
} as const

// resource = "order" -> dtos['order']
function toDTO<K extends ResourceName>(resource: K, value: ResourceType<K>) {
  return dtos[key](value)
}
```

### Read

The read layer sits between API and the repos.

It depends on the `read-commons` interfaces rather than full repos — only the read operations it needs, making the layer easier to test in isolation.

Readers are injected at startup — see [Dependency injection](#dependency-injection).

```ts
// read-one.ts

// `ByKey` is a `read-commons` interface
type ByIdReaders = {
  [K in ResourceName]: ByKey<ResourceType<K>, any>
}

// look up correct reader
// -> get record -> transform toDTO -> return dto
export const makeReadOne = (readers: ByIdReaders) =>
  async function readByKey<R extends ResourceName>(
    resource: R,
    key: ResourceKey<R>
  ): Promise<ResourceType<R> | null> {
    const result = await readers[resource].findByKey(key)
    if (!result) return null
    return toDTO(resource, result)
  }
```

Before returning the result, the read layer transforms items to their DTO representation.

Reading a page works similarly, with one extra step — hydrating results with any related records requested via `include`.

**Include**

A page query can specify whether to include related records — but only for M:1 or 1:1 relationships.

For example, each order in a page can include its nft-collection, but an nft-collection page can't include its orders.

To use includes in queries — see [Available query parameters](#available-query-parameters).

> [!IMPORTANT]
> `NFT` is not yet available as an include target — its relations haven't been defined in `relations.ts`.

**Relations**

Relations are defined at domain layer, but solely used in read layer, you'll see an example in the section after this. It might as well be moved to

### Repos

Repos are the only layer that talks directly to the database.

Each repo implements:

- the resource-specific `Port` interface from the domain layer
- shared read interfaces from `read-commons`

The rest of the application never talks to MongoDB directly. Repos are wired in at startup, so replacing the database mostly means providing another set of repo implementations.

#### Mongo

Mongo repos and their shared utilities are found in `repos/mongo`.

| File                                     | Description                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `shared/_read.ts` / `_write.ts`          | shared read and write helpers reused across repos                                                                                 |
| `model/field-config.ts`                  | maps domain fields to mongo-specific fields, eg. routing sorting on string field `order.price` to the Decimal128 field `db.price` |
| `shared/pagination/find-page-generic.ts` | generic cursor-paginated `findPage` implementation reused across repos                                                            |
| `model/docs.ts`                          | maps domain models to their denormalized MongoDB document representation                                                          |
| `shared/to-repo-query.ts`                | maps `PageQuery` into the shape expected by `find-page-generic`                                                                   |

### Listeners

For every configured chain, the application subscribes to the marketplace contract defined in the chain config file.

When a log is observed, the listener checks whether a handler exists for the decoded event.

```ts
// registry event -> handler
const routers: Record<string, (item: ListenerItem) => Promise<void>> = {
  Settlement: handleSettlement,
  OrderCancelled: handleOrderCancelled,
}
```

An event that doesn't map to a handler is silently discarded.

Handlers parse events to their expected domain shape. Persistance happens through calling the appropriate action.

Actions are wired at startup — see [Dependency injection](#dependency-injection).

Supported events are documented in [Listeners](#listeners-1) under Reference.

### Workers

Workers are long-running background jobs started per configured chain.

Each worker exposes a `run()` method:

```ts
type Worker = {
  name: string
  run: () => Promise<void>
}
```

Every worker runs inside its own async loop. After a run completes, the loop sleeps before starting the next cycle.

Workers are grouped into two categories:

| Type      | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| Enrichers | Fetch missing metadata for incomplete records already stored in DB |
| Pollers   | Scan chain state to build missing historical context               |

For example:

- `nft-collections/meta` enriches stored collections with name and symbol
- `nft-collections/backfill` reads historical `Transfer` events to reconstruct NFTs
- `settlements/call-reconstruction` attaches transaction context to settlements

If a worker throws, the error is logged and the loop continues running.

Workers are documented in [Workers](#workers-1) under Reference.

### Dependency Injection

Dependencies are assembled under `di/` during startup.

**Actions**

Domain actions is the layer that calls write ops in repos, they are injected in `di/write.ts`.

```ts
export const orderActions = makeOrderActions({
  orders: orderRepo,
  nftCollections: nftCollectionRepo,
  realtime,
})
```

In the example above:

- `orderRepo` satisfies the `OrderPort` interface
- `nftCollectionRepo` satisfies the `NFTCollectionPort` interface
- `realtime` satisfies the `RealtimePort` interface

API / listeners / workers (what the fuck is a better word here) imports whatever action needed;

- API: Order ingestion route imports `orderActions`.
- Listeners: Settlement handler imports `settlementActions`
-

## Data flow

Each flow traces a request or event step-by-step through the codebase.

### Read page

Read a page of orders, include related NFTCollections.

**Route:** `GET /api/orders?include=settlement`

1. `di/read.ts` — `readPage` is `makeReadPage(readers)` with repos injected at startup
2. `api/routes/orders/query.ts` — builds page query, calls `readPage`
3. `read/read-page.ts` — fetches page from repo, hydrates includes // wrong this happens in hydrate-page read-page just do branching logic and reads page if not accepts includes, if accepts includes its sent to
4. `read/shared/hydrate-page.ts` — fetches related records
5. `repos/mongo/order.repo.ts` — runs query against MongoDB
6. `read/shared/apply-dtos.ts` — transforms results before returning

### Receive order

**Route:** `POST /api/orders`

1. `di/write.ts` — `orderActions` is `makeOrderActions(repos)` with repos injected at startup
2. `api/routes/orders/ingest.ts` — validates body and headers, calls `ingestOrder`
3. `domain/order/actions.ts` — validates order rules, persists via repo, notes NFT collection
4. `repos/mongo/order.repo.ts` — upserts order to MongoDB
5. `domain/order/actions.ts` — broadcasts `order.created` via realtime port

### Observe event

**Event:** `Settlement` log from `OrderEngine` contract

1. `di/write.ts` — `settlementActions` is `makeSettlementActions(repos)` with repos injected at startup
2. `listeners/start.ts` — receives log, routes to `handleSettlement`
3. `listeners/settlements/from-log.ts` — parses log into settlement domain model
4. `listeners/settlements/handler.ts` — calls `ingestSettlement`
5. `domain/settlement/actions.ts` — persists settlement, notes NFT collection, broadcasts `settlement.created`

---

## Reference

### Listeners

| Event            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `Settlement`     | parses log, persists settlement, notes NFT collection |
| `OrderCancelled` | parses log, marks matching orders as cancelled        |

### Workers

| Worker                            | Type     | Description                                                            |
| --------------------------------- | -------- | ---------------------------------------------------------------------- |
| `nft-collections/meta`            | Enricher | fetches name, symbol, and type for collections seen for the first time |
| `nfts/meta`                       | Enricher | fetches token URI and metadata for individual NFTs                     |
| `settlements/call-reconstruction` | Enricher | decodes `settle()` calldata from the transaction receipt               |
| `nft-collections/backfill`        | Poller   | reads Transfer events from chain to backfill NFTs in a collection      |

### API

#### Routes – Ingest

**Order**

| Method | Path          | Description           |
| ------ | ------------- | --------------------- |
| `POST` | `/api/orders` | Ingest a signed order |

Example `Order` POST request:

```http
Content-Type: application/json
X-Chain-Id: 31337

{
 "actor": "0x...",
 "collection": "0x...",
 "currency": "0x...",
 "end": 1868226790,
 "isCollectionBid": false,
 "nonce": "1",
 "price": "100000000000000000",
 "side": 0,
 "signature": {
   "r": "0x...",
   "s": "0x...",
   "v": 28
 },
 "start": 0,
 "tokenId": "67"
}
```

Order validation rules:

- `price` > 0, valid uint string (max 34 digits)
- `end` greater than `start`
- `start` and `end` in unix seconds
- `side` `0` (ask) or `1` (bid)
- `actor` not the zero address

#### Routes – Query

**Page**

| Method | Path                   | Description               |
| ------ | ---------------------- | ------------------------- |
| `GET`  | `/api/orders`          | Orders (cursor-paginated) |
| `GET`  | `/api/settlements`     | Settlements               |
| `GET`  | `/api/nfts`            | NFTs with trait filters   |
| `GET`  | `/api/nft-collections` | Collections               |
| `GET`  | `/healthcheck`         | Liveness check            |

**Item by ID**

| Method | Path                       | Id format                    |
| ------ | -------------------------- | ---------------------------- |
| `GET`  | `/api/orders/:id`          | `chainId:orderHash`          |
| `GET`  | `/api/settlements/:id`     | `chainId:orderHash`          |
| `GET`  | `/api/nfts/:id`            | `chainId:collection:tokenId` |
| `GET`  | `/api/nft-collections/:id` | `chainId:address`            |

#### Query parameters

**Pagination**

| Param     | Type            | Notes                              |
| --------- | --------------- | ---------------------------------- |
| `limit`   | number          | 1–100                              |
| `cursor`  | string          | from `nextCursor` in previous page |
| `sortDir` | `asc` \| `desc` | defaults to `desc`                 |

**Orders**

| Filter            | Type               | Notes                                      |
| ----------------- | ------------------ | ------------------------------------------ |
| `chainId`         | number             |                                            |
| `orderHash`       | bytes32            |                                            |
| `status`          | string             | `active`, `filled`, `cancelled`, `expired` |
| `actor`           | address            |                                            |
| `collection`      | address            |                                            |
| `tokenId`         | string / string[]  |                                            |
| `currency`        | address            |                                            |
| `price`           | string             |                                            |
| `side`            | `0` \| `1`         |                                            |
| `isCollectionBid` | boolean            |                                            |
| `start`           | number             | unix seconds                               |
| `end`             | number             | unix seconds                               |
| `txHash`          | bytes32            |                                            |
| `or.side`         | string or string[] | OR filter                                  |
| `or.tokenId`      | string or string[] | OR filter                                  |
| `trait`           | string             | filter by related NFT trait name           |
| `value`           | string             | filter by related NFT trait value          |
| `include`         | string[]           | `nftCollection`                            |

Sort fields: `createdAt`, `updatedAt`, `price`, `start`, `end`, `expires`, `actor`

**Settlements**

| Filter       | Type               | Notes                             |
| ------------ | ------------------ | --------------------------------- |
| `chainId`    | number             |                                   |
| `orderHash`  | bytes32            |                                   |
| `collection` | address            |                                   |
| `tokenId`    | string / string[]  |                                   |
| `seller`     | address            |                                   |
| `buyer`      | address            |                                   |
| `txHash`     | bytes32            |                                   |
| `or.buyer`   | string or string[] | OR filter                         |
| `or.seller`  | string or string[] | OR filter                         |
| `trait`      | string             | filter by related NFT trait name  |
| `value`      | string             | filter by related NFT trait value |
| `include`    | string[]           | `order`, `nftCollection`          |

Sort fields: `createdAt`, `updatedAt`, `price`, `buyer`, `seller`, `timestamp`

**NFTs**

| Filter       | Type              | Notes       |
| ------------ | ----------------- | ----------- |
| `collection` | address           |             |
| `tokenId`    | string / string[] |             |
| `trait`      | string            | trait name  |
| `value`      | string            | trait value |

**NFT Collections**

No filters beyond pagination.

> [!NOTE]
> This backend is tailored for the specific frontend implementation of the `d | mrkt` demo. It only seeds one NFT collection, so filters / pagination wasn't needed for this model.
>
> Any future version will surely be extended to include this.

### Response shapes

**Page**

```js
{
  items: T[] // Order | Settlement | NFT | NFTCollection
  nextCursor: string | null
}
```

**Order**

```js
{
  id: string                 // chainId:orderHash
  chainId: number
  orderHash: string
  side: 'ask' | 'bid'
  isCollectionBid: boolean
  collection: string
  tokenId: string
  price: string
  currency: string
  actor: string
  start: number              // unix ms
  end: number                // unix ms
  status: string
  txHash?: string
  rawOrder: Order
  createdAt: number
}
```

**Settlement**

```js
{
  id: string                 // chainId:orderHash
  chainId: number
  orderHash: string
  txHash: string
  collection: string
  tokenId: string
  seller: string
  buyer: string
  currency: string
  price: string
  blockNumber: number
  timestamp: number          // unix ms
  logIndex: number
  txContext?: {
    txIndex: number
    functionSelector: string
    functionName: string
    contractAddress: string
    gasUsed: number
    gasPrice: number
  }
  createdAt: number
}
```

**NFT**

```js
{
  id: string                 // chainId:collection:tokenId
  chainId: number
  collection: string
  tokenId: string
  tokenUri?: string
  name?: string
  description?: string
  image?: string
  attributes?: { trait_type: string; value: string }[]
  createdAtBlock: number
  createdAt: number
}
```

**NFT Collection**

```js
{
  id: string                 // chainId:address
  chainId: number
  address: string
  name?: string
  symbol?: string
  tokenType?: string
  totalSupply?: string
}
```

### WebSocket events

| Event                          | Payload                  |
| ------------------------------ | ------------------------ |
| `order.created`                | `{ chainId, orderHash }` |
| `order.cancelled`              | `{ chainId, orderHash }` |
| `settlement.created`           | `{ chainId, orderHash }` |
| `settlement.callReconstructed` | `{ chainId, orderHash }` |

`settlement.callReconstructed`: workers have collected and attached transaction context to a settlement record, eg. gas used, calldata, function name (derived from selector).

---

If you have any questions, or just want to talk web3 infra, feel free to reach out on my [discord](https://discord.com/users/745594868826505227).

**See ya 👾**
