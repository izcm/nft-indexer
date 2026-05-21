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

This indexer is at version v.0, ready for demo purposes. It's built around a specific marketplace contract, available [here](https://github.com/izcm/dmrkt-contracts/blob/main/contracts/orderbook/OrderEngine.sol). The architecture is designed to handle multiple chains.

**Ingestion**

Signed EIP-712 orders are ingested through POST requests to API.

On-chain events — `Settlement` and `OrderCancelled` — are picked up by log listeners subscribed to the RPC and used to update order status.

When an order or settlement is ingested the address in its collection field is noted, and stored to DB if not already there. Here it will be enriched with additional metadata, which is fetched from periodic background workers.

**Workers**

Background jobs run periodically. Each worker fits into one of two groups:

| Type      | Description                                                             | Example                                                                    |
| --------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Enrichers | Pick up incomplete records and fetch missing data from external sources | Get a stored collection's name and symbol from chain and attach to record. |
| Pollers   | Poll chain data to fill in context for records already in the database. | NFT backfill for a newly stored collection.                                |

A record that hasn't been enriched yet is still queryable through the API.

**API**

The API is simple, with a query route for every domain model and an ingestion route for signed orders. Query routes each expose a by-key and a pagination endpoint.

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

Each RPC is queried for its chain-id, code throws if the URL doesn't point to a valid RPC or if the response chain-id is not found in `viem/chains`.

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
  Side side; // 0 = ask, 1 = bid
  bool isCollectionBid;
  address collection;
  uint256 tokenId; // ignored if isCollectionBid = true
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
```

The design choices made are DDD-inspired, focus being on _framework as a detail_ rather than ensuring perfect DDD architecture.

### API

Built with Fastify. Query params and POST bodies are validated through JSON schemas.

API is minimal, each data model has two query routes:

| Route  | Description                   |
| ------ | ----------------------------- |
| `/:id` | reads a single resource by id |
| `/`    | read a page                   |

The only domain model that is ingestable is `Order`.

> [!NOTE]
> Available query parameters, `id` formats, response shapes, and `Order` POST body example are given in the [API reference](#api-1)

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

Routes import read functions from `di/read.ts`. Ingestion goes through domain `actions`, imported from `di/write.ts`. See [Dependency injection](#dependency-injection).

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

**ResourceMap**

`resource.ts` defines the resource registry, a mapping between a resource's string name to their respective type and key (unique id).

The snippet below is a composed example showing a typical use of the resource registry.

```js
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

### Read layer

The read layer sits between API and the repos.

It depends on the `read-commons` interfaces rather than full repos — only the read operations it needs, making the layer easier to test in isolation.

Readers are injected at startup — see [Dependency injection](#dependency-injection).

```js
// read-one.ts

// `ByKey` is a `read-commons` interface
type ByIdReaders = {
  [K in ResourceName]: ByKey<ResourceType<K>, any>
}


// look up correct reader / repo
// -> get record -> transform toDTO -> return
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

Before returning data to API, the read layer transforms it to its DTO representation.

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

Repos implement the domain port interfaces (`ByKey`, `Pageable`) — nothing more. The domain layer defines what a repo must do; the mongo implementation is a detail.

Shared helpers in `repos/mongo/shared/`:

- `_read.ts` / `_write.ts` — common read and write operations reused across repos
- `docs.ts` — mapping between domain models and mongo documents
- `field-config.ts` — declares which fields are sortable and filterable per repo
- `pagination/to-repo-query.ts` — maps `PageQuery` to mongo cursor args
- `pagination/find-page-generic.ts` — generic cursor-paginated `findPage` used by all repos

### Listeners

Each chain client subscribes to contract events from `OrderEngine` via viem's `watchContractEvent`. Incoming logs are routed by event name to a handler. Each handler parses the log and calls the appropriate domain action. See [Listeners](#listeners-1) in Reference.

### Workers

Workers run in a loop, sleeping 10 seconds between cycles. Each cycle runs all workers sequentially per chain. Workers are either enrichers (fetch missing data for incomplete records) or pollers (scan chain state to fill in context). See [Workers](#workers-1) in Reference.

### Dependency Injection

---

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

#### Routes – POST

**Order**

| Method | Path          | Description           |
| ------ | ------------- | --------------------- |
| `POST` | `/api/orders` | Ingest a signed order |

Example request:

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

#### Available query parameters

**Filters**

**Whitelisted sort fields**

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

### Filter examples

`http/` contains a range of

### Fill in later

- filter examples
- pagination shape
- sample response

---

### Future improvements

ERC1155 support
better caching
metrics

---

If you have any questions, or just want to talk web3 infra, feel free to reach out on my [discord](https://discord.com/users/745594868826505227).

**See ya 👾**
