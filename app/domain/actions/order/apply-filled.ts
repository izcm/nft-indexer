import { Hex } from 'viem'
import { orderRepoFor } from '#app/repos/order.repo.js'

const TAG = 'order:filled'

export async function applyOrderFilled(chainId: number, orderHash: Hex) {
  const repo = orderRepoFor(chainId)

  // skip if order not registered
  const orderRecord = await repo.findByHash(orderHash)
  if (!orderRecord) return

  // === mark order as filled ===

  try {
    await repo.markFilled(orderHash)
  } catch (err) {
    throw new Error(`[${TAG}] markFilled failed`, { cause: err })
  }
}
