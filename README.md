# dmrkt-indexer

Minimal indexer for d|mrkt.

This service ingests signed orders over HTTP, verifies them, normalizes the data,
and stores them in MongoDB.

## Tech Stack

- Node.js
- TypeScript
- viem (EVM interactions & signature verification)
- Fastify (HTTP server)
- MongoDB (via Mongoose)

## Development

```bash
npm install
npm run dev
```

---

# System Description

Of course — here’s a clean copy-paste section you can drop straight into your README:

---

## 🧭 Domain Ownership Rule

This project follows a strict separation of responsibilities to keep the indexer deterministic and replay-safe.

**All state mutations must go through the domain layer.**

Repositories are persistence adapters, not business logic services.

### Rules

- Routes, listeners, workers, and scripts **must not write directly to repositories**.
- They may only translate external input (HTTP, blockchain logs, jobs) into domain calls.
- The **domain layer is the only place allowed to create or mutate records**.
- Repositories may be used outside the domain **for reads only** (queries, pagination, analytics).

### Required flow

```
HTTP / Blockchain / Worker
        ↓
      Domain
        ↓
    Repositories
        ↓
      Database
```

### Why

This guarantees:

- deterministic replay of blockchain events
- no partial state commits
- consistent behavior across ingestion, backfill, and live listeners
- a single source of truth for business invariants

If a record exists in the database, it means the domain has already accepted and processed that event.

---
