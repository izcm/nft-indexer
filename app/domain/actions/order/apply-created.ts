import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collections/collection.repo.js'
import { OrderCore } from '../../types/order.js'

export async function applyOrderCreated(
  chainId: number,
  order: OrderCore,
  opts?: { waitForStats?: boolean }
) {
  const { side, isCollectionBid, collection, start } = order

  const tag = 'order:created'

  const p = statsRepo
    .recordOrderCreated({
      chainId,
      collection,
      isCollectionBid,
      side,
      timestamp: Number(start), // timestamp = unix in seconds enforced in JSON schema
    })
    .catch(err => console.error(`[${tag}] recordOrderCreated failed`, err))

  if (opts?.waitForStats) {
    await p
  } else {
    void p
  }

  void nftCollectionRepo
    .noteCollection(chainId, order.collection)
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))
}
