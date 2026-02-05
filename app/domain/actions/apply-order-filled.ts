import { Hex } from 'viem'

import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'

// call when settlement.timestamp is unknown to caller
export async function applyOrderFilledBySettlement(chainId: number, orderHash: Hex) {}

// when caller knows settlement block.timestamp
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

  // order itself may or may not be registered in our db
  const orderRecord = await orderRepo.findByHash(orderHash)

  // skip stat update if order record missing
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
    // strict
    await p
  } else {
    // fire-and-forget
    void p.catch(err => console.error('[order:filled:stats] recordOrderFilled failed', err))
  }
}
