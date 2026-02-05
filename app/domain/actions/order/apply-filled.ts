import { Hex } from 'viem'

import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'

export async function applyOrderFilled(
  chainId: number,
  orderHash: Hex,
  filledAt: number,
  opts?: { waitForStats?: boolean }
) {
  const orderRepo = orderRepoFor(chainId)

  // === mark order as filled ===

  try {
    await orderRepo.markFilled(orderHash) // upserts `orderStats`
  } catch (err) {
    throw new Error('[order:filled] markFilled failed', { cause: err })
  }

  // === update stats ===

  // skip if order not registered
  const orderRecord = await orderRepo.findByHash(orderHash)
  if (!orderRecord) return

  const { side, isCollectionBid, collection } = orderRecord.order

  const p = statsRepo.recordOrderFilled({
    chainId,
    collection,
    side,
    isCollectionBid,
    timestamp: filledAt,
  })

  if (opts?.waitForStats) {
    await p
  } else {
    void p.catch(err => console.error('[order:filled:stats] recordOrderFilled failed', err))
  }
}
