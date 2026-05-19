# d | mrkt indexer

A component of the web3 demo; `d | mrkt`.

It's an indexer that:

- Ingests signed EIP-172 orders and on-chain events
- Stores normalized marketplace state in MongoDB
- Exposes REST + realtime feeds for consumers

> ⚠️ **NB:** Not production-ready

---

## Overview

This indexer is at version v.0, ready for demo purposes. It's built around a specific marketplace contract, whose code is available on [Github](https://github.com/izcm/dmrkt-contracts). While it only supports local Anvil as is, the architecture is built to handle multichain.

Next comes a quick overview of the system. For more specific explanations, see [References](#reference).

**Ingestion**

Signed EIP-712 orders are ingested through POST requests, in the request body. Its structure must match the `Order` struct:

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

On-chain events — `Settlement` and `OrderCancelled` — are picked up by log listeners subscribed to the RPC and used to update order status.

When an order or settlement is ingested the address in its collection field is noted, and stored to DB if not already there. Here it will be enriched with additional metadata, which is fetched from periodic background workers.

**Workers**

Background jobs run after ingestion, each worker fits into one of the two groups:

| Type      | Description                                                             | Example                                                                    |
| --------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Enrichers | Pick up incomplete records and fetch missing data from external sources | Get a stored collection's name and symbol from chain and attach to record. |
| Pollers   | Poll chain data to fill in context for records already in the database. | NFT backfill for a newly stored collection.                                |

A record that hasn't been enriched yet is still queryable through the API.

**API**

The API is simple, with a query route for every domain model and an ingestion route for signed orders. Query routes each expose a by-key and a pagination endpoint.

There is per v.0 zero auth mechanisms, anyone can read data and post orders, though order fields needs to pass certain validation criteria. Query parameters and POST bodies are validated / whitelisted through JSON schemas.

---

## Prerequisites

An `OrderEngine` contract must be deployed per chain. RPC URLs and contract addresses are configured in `chains.json` — see `chains.example.json` for the expected shape.

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

---

## Run

todo: add anvil container to docker-compose

```bash
docker compose up
```

Local dev (requires MongoDB and a running Anvil fork):

```bash
npm run dev
```

---

## Web3 layer

### Multichain

Chain configuration lives in `chains.json` — an array of `{ rpcUrl, marketplaceAddr }` objects, one per chain. On boot, the indexer creates one viem client per entry and fans out listeners and workers across all of them. `chainId` is derived from the RPC, so no chain-specific env vars are needed. All domain data is scoped by `chainId` in MongoDB, so multiple chains share the same database without collision.

### Token standards

NFT collections are noted when related orders / settlements are ingested. Only the address is noted, with no checks on what standard, so it can literally be any address. Some checks on standard pre-persist might be added later.

Enrichment / NFT backfill workers only support ERC-721, addresses that don't support it won't be enriched.

### EIP-712

---

## Architecture

```txt
api        -> routes
domain     -> business logic
listeners  -> blockchain events
workers    -> background jobs
repos      -> MongoDB
read       -> frontend query shaping
```

The design choices made are DDD-inspired. The focus was being _framework as a detail_ more than ensuring perfect DDD architecture.

**_Empty appartment complex_**

### Domain

The domain can be thought of as an empty appartment complex:

- appartments: the domain models (`order`, `settlement`, `nft`, `nftCollection`)
- doors: how data enters, any rules on its form, and any effects of its entry
- windows: how data is read

But no furniture – its decoupled from all frameworks.

“Resource” in this codebase refers to the complete representation of a model — not just its shape, but also its key type, ports, relations, DTO transforms, and read behavior.

Each resource in the domain follows the same structure:

| File         | Description                                              |
| ------------ | -------------------------------------------------------- |
| `model.ts`   | types and shape of the resource                          |
| `port.ts`    | interface for persistence — what the repo must implement |
| `actions.ts` | what happens when something occurs — orchestrates ports  |
| `rules.ts`   | pure validation logic, no side effects                   |

The API is injected with a read layer rather than calling repos directly. Read functions each wrap a repo query and transform the result into a DTO before returning it to the route — keeping response shaping out of both the route and the repo.

#### Resource

files: [ resource.ts ]

“Resource” in this codebase refers to the complete representation of a model — not just its shape, but also its key type, ports, relations, DTO transforms, and read behavior.

The read layer is built around a central `ResourceMap` type that registers every domain resource — its model type and key type — under a string name. `read-one` and `read-page` are generic over this map, so a single implementation handles all resources. Adding a new resource means adding one entry to the map; the rest follows automatically.

A route calls `readByKey(resource, key)` — the read layer looks up the right repo reader, fetches the record, runs it through the resource's DTO transform, and returns the shaped response. Response shaping never leaks into routes or repos.

**Relations between resources**

files: [ relations.ts ]

`ResourceMap` is also the backbone of the relation and include system:

- `Readers` — type-safe map of repo readers, one per resource, injected into the read layer
- `relations` — defines how resources relate to each other (e.g. a settlement derives its `OrderKey`), used when resolving includes
- `WithIncludes<R>` — generic type for a resource with optional related resources attached, used by `read-page` when `?include=` is in the request
- `pkOf` — maps each resource to its key extractor function

### Read

**Example flow: `GET /api/orders?include=settlement`**

1. `api/routes/orders/query.ts` — route builds a `PageQuery` via `buildPageQuery()` + `buildFilters()`, calls `readPage('order', { ...pageQuery, include })`
2. `di/read.ts` — `readPage` is `makeReadPage(readers)` with repos injected
3. `read/read-page.ts` — takes `PageRequest<'order'>`, passes query to repo's `findPage`, then hydrates includes
4. `read/shared/hydrate-page.ts` — resolves includes by fetching related resources using `relations`
5. `repos/mongo/shared/_read.ts` — calls `mapToRepoQuery` to convert `PageQuery` → mongo cursor args
6. `repos/mongo/shared/pagination/to-repo-query.ts` — maps `PageQuery` → `GenericPageArgs`, builds mongo filters
7. `read/shared/apply-dtos.ts` — runs each result through `applyDTOs('order', ...)` including included relations
8. response back to route

### Repositories

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

POST body must embed the order's signature, the posted order must also pass certain validity checks.

On-chain events — `Settlement` and `OrderCancelled` — are picked up by log listeners subscribed to the RPC and used to update order status.

> The `Order` struct, EIP-712 domain, and the events mentioned above are defined by the `OrderEngine` contract <REPO_LINK>. The EIP-712 domain (including the domain separator) is defined in [eip712.ts](app/lib/blockchain/eip712.ts) and is used when verifying inbound orders and interpreting on-chain events.

### Fill in later

- websocket events
- filter examples
- pagination shape
- sample response

---

## Future improvements

For v.1, the plan is to patch bugs / inconsistencies and make it ready to index for live Sepolia testnet.

### Fill in later

- ERC1155
- better caching
- metrics

---

If you encountered any problem running this repo, or just want to talk web3 infra, feel free to reach out on my [discord](https://discord.com/users/745594868826505227).

**See ya 👾**
