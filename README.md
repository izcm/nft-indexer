# dmrkt indexer

event-driven NFT indexer.

ingests on-chain events → stores in mongo → exposes API + realtime updates.

## run

docker compose up

## architecture

contracts → indexer → mongo → api → websocket → frontend

## features

- order ingestion
- settlement tracking
- attribute filtering
- cursor pagination
- realtime feed

## example

GET /orders?trait=stamina,stamina&value=epic,legendary
