// scan active orders (batched)
// → check settlement by (chainId, orderHash)
// → if exists → mark filled
// → recompute counts + volume
// → write aggregates fresh
