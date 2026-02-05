import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import {
  nftCollectionRepo,
  nftCollectionRepoFor,
} from '#app/repos/nft-collections/collection.repo.js'
import { OrderCore, OrderRecord } from '../types/order.js'

export async function applyOrderCreated(
  chainId: number,
  order: OrderCore,
  opts?: { waitForStats?: boolean }
) {
  const { side, isCollectionBid, collection, start } = order

  const p = statsRepo.recordOrderCreated({
    chainId,
    collection,
    isCollectionBid,
    side,
    timestamp: Number(start), // timestamp = unix in seconds enforced in JSON schema
  })

  if (opts?.waitForStats) {
    // strict mode
    await p
  } else {
    void p.catch(err => console.error('[order:created:stats] recordOrderCreated failed', err))
  }

  // always fire and forget
  void nftCollectionRepo
    .noteCollection(chainId, order.collection)
    .catch(err => console.error('[order:created:nft-collection] failed to note collection', err))
}
