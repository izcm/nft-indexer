import { Hex } from 'viem'

import { nftCollectionStatsRepo as statsRepo } from '#app/repos/stats.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'

export async function applyOrderFilled(chainId: number, orderHash: Hex, filledAt: number) {
  const orderRepo = orderRepoFor(chainId)

  // skip if order not registered
  const orderRecord = await orderRepo.findByHash(orderHash)
  if (!orderRecord) return

  const tag = 'order:filled'

  // === mark order as filled ===

  try {
    await orderRepo.markFilled(orderHash)
  } catch (err) {
    throw new Error(`[${tag}] markFilled failed`, { cause: err })
  }
}
