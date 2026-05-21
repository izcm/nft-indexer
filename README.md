# d | mrkt indexer

A component of the web3 demo; `d | mrkt`.

It's an indexer that:

- Ingests signed EIP-172 orders and on-chain events
- Stores normalized marketplace state in MongoDB
- Exposes REST + realtime feeds for consumers

> [!WARNING]
> Not production ready.

**Contents** — [Overview](#overview) · [Prerequisites](#prerequisites) · [Run](#run) · [Web3 layer](#web3-layer) · [Architecture](#architecture) · [Reference](#reference) · [Future improvements](#future-improvements)

---

## Overview

This indexer is at version v.0, ready for demo purposes. It's built around a specific marketplace contract, whose code is available on [Github](https://github.com/izcm/dmrkt-contracts/blob/main/contracts/orderbook/OrderEngine.sol). The architecture is built to handle multiple chains.

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

There is per v.0 zero auth mechanisms, anyone can read data and post orders. Query parameters and POST bodies are validated / whitelisted through JSON schemas.

---

## Prerequisites

An `OrderEngine` contract must be deployed per chain,. Deployment is straightforward, [repo](https://github.com/izcm/dmrkt-contracts) `README` explains how.

RPC URLs and contract addresses are configured in `chains.json` — see `chains.example.json` for the expected shape.

> [!IMPORTANT]
> If `marketplaceAddr` doesn't point to a deployed `OrderEngine`, the indexer will run fine but never pick up any events.

### Dependencies

| Tool   | Version | Notes                            |
| ------ | ------- | -------------------------------- |
| Node   | ≥ 22    |                                  |
| Docker | \_\_\_  | MongoDB & Anvil runs via compose |

### Environment variables

| VAR                | Description                                                                         | Required | Example                     |
| ------------------ | ----------------------------------------------------------------------------------- | -------- | --------------------------- |
| `MONGODB_URI`      | MongoDB connection string                                                           | Yes      | `mongodb://localhost:27017` |
| `DB_NAME`          | MongoDB database name                                                               | Yes      | `dmrkt`                     |
| `CHAINS_CONFIG`    | Path to chains.json                                                                 | No       | `./chains.json`             |
| `FORK_START_BLOCK` | Block used as starting point for polling. If not set, poll starts at genesis block. | No       | `21000000`                  |

---

## Run

The [docker-compose](./docker-compose.yml) in repo root builds two containers:

1. Anvil: local Ethereum node
2. Mongo: local MongoDB instance

> This command does not deploy the `OrderEngine` contract.

Spin up the containers by running:

```bash
docker compose up --build
```

> Omit the `--build` flag if you want to keep the state of previous builds. (how do I say this?)

When containers are up, run the indexer:

```bash
npm run dev
```

---

## Web3 layer

### Multichain

Chain configuration lives in `chains.json` — an array of `{ rpcUrl, marketplaceAddr }` objects, one per chain. On boot, the indexer creates one viem client per entry and starts listeners and workers across all of them.

Each RPC is queried for its chain-id, throws if the URL does not point to a valid RPC or if the response chain-id is not found in `viem/chains`.

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

API is kept very simple, each domain modal has a query route with
Each domain model has a query route

### Domain

This domain can be thought of as an empty apartment complex:

- apartments: the domain models (`order`, `settlement`, `nft`, `nftCollection`)
- doors: how data enters, any rules on its form, and any effects of its entry
- windows: how data is read

But no furniture – its decoupled from all frameworks.

The project uses the term “Resource” when refering to the complete representation of a model — not just its shape, but also its key type, ports, relations, DTO transforms, and read behavior.

Each resource in the domain follows the same structure:

| File         | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `model.ts`   | types and shape of the resource                                 |
| `port.ts`    | interface for persistence — what the repo must implement        |
| `actions.ts` | what happens when something occurs — orchestrates ports         |
| `rules.ts`   | pure validation logic, eg. order timestamps are in unix seconds |

Though each resource doesn't have to implement all of the above.

#### Resource

file: [ resource.ts ]

The domain contains a sort of registry of the resources, so we can connect each resoruce to their respective keys (unique id), repo and DTO transforms.

```ts
// maps resource names to their associated types
// allows generic functions to resolve the correct key + model types
type ResourceMap = {
  order: {
    type: OrderRecord
    key: OrderKey
  }
  // ...
}

const dtos: { [R in ResourceName]: (x: ResourceType<R>) => any } = {
  order: toOrderDTO,
  // ...
} as const

// resource = "order" -> dtos['order']
function toDTO<K extends ResourceName>(resource: K, value: ResourceType<K>) {
  return dtos[key](value)
}
```

Adding a new resource means adding one entry to the map; the rest follows automatically.

### Read

The layer sits between API and the repositories.

```
route
  ↓
read
  ↓
repo
  ↓
MongoDB
```

The read layer does not depend on full repos directly. Instead, it depends on a smaller `read-commons` interface containing only the read operations it needs, making it easier to test in isolation.

Readers are injected at startup — see [Dependency injection](#dependency-injection).

Before returning data to caller, the read layer transforms it to via the respective resource toDTO function.

```js
// injected at startup
type ByIdReaders = {
  [K in ResourceName]: ByKey<ResourceType<K>, any>
}

/*
 look up correct reader / repo
 -> get record -> transform toDTO -> return
*/
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

Process is similar when reading a page of items, also using the resource registry to pick appropriate reader.

**Includes**

A page query can specify whether to include any related resources, though only for 1:1 relationships to resource queried after.

file: [ relations.ts ]

Kind of a rabbit hole in hindsight, the relations were made to enable including a related record when querying. Example: users query for `settlement`record and wants to attach the related `nft-collection`.

Relations are defined at domain layer, but solely used in read layer, you'll see an example in the section after this. It might as well be moved to

**Example flow: `GET /api/orders?include=settlement`**

1. `api/routes/orders/query.ts` — route builds a `PageQuery` via `buildPageQuery()` + `buildFilters()`, calls `readPage('order', { ...pageQuery, include })`
2. `di/read.ts` — `readPage` is `makeReadPage(readers)` with repos injected
3. `read/read-page.ts` — takes `PageRequest<'order'>`, passes query to repo's `findPage`, then hydrates includes
4. `read/shared/hydrate-page.ts` — resolves includes by fetching related resources using `relations`
5. `repos/mongo/shared/_read.ts` — calls `mapToRepoQuery` to convert `PageQuery` → mongo cursor args
6. `repos/mongo/shared/pagination/to-repo-query.ts` — maps `PageQuery` → `GenericPageArgs`, builds mongo filters
7. `read/shared/apply-dtos.ts` — runs each result through `applyDTOs('order', ...)` including included relations
8. response back to route

### Repos

### DI

---

## Reference

### Workers

| Worker                            | Type     | Description                                                            |
| --------------------------------- | -------- | ---------------------------------------------------------------------- |
| `nft-collections/meta`            | Enricher | fetches name, symbol, and type for collections seen for the first time |
| `nfts/meta`                       | Enricher | fetches token URI and metadata for individual NFTs                     |
| `settlements/call-reconstruction` | Enricher | decodes `settle()` calldata from the transaction receipt               |
| `nft-collections/backfill`        | Poller   | reads Transfer events from chain to backfill NFTs in a collection      |

### API

| Method | Path                   | Description                                 |
| ------ | ---------------------- | ------------------------------------------- |
| `POST` | `/api/orders`          | Ingest a signed order                       |
| `GET`  | `/api/orders`          | Query orders (cursor-paginated, filterable) |
| `GET`  | `/api/settlements`     | Query settlements                           |
| `GET`  | `/api/nfts`            | Query NFTs with trait filters               |
| `GET`  | `/api/nft-collections` | Query collections                           |
| `GET`  | `/healthcheck`         | Liveness check                              |

Example `api/orders` POST request:

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

### WebSocket events

| Event                          | Payload                  |
| ------------------------------ | ------------------------ |
| `order.created`                | `{ chainId, orderHash }` |
| `order.cancelled`              | `{ chainId, orderHash }` |
| `settlement.created`           | `{ chainId, orderHash }` |
| `settlement.callReconstructed` | `{ chainId, orderHash }` |

`settlement.callReconstructed`: workers have collected and attached transaction context to a settlement record, eg. gas used, calldata, function name (derived from selector).

### Fill in later

- filter examples
- pagination shape
- sample response

---

## Future improvements

For v.1, the plan is to patch bugs / inconsistencies so it's production ready to index live events from Sepolia testnet and accept off chain orders from a`d | mrkt` browser client.

### Fill in later

- ERC1155
- better caching
- metrics

---

If you encountered any problem running this repo, or just want to talk web3 infra, feel free to reach out on my [discord](https://discord.com/users/745594868826505227).

**See ya 👾**
