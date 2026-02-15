import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'
import { Hex } from 'viem'
import { OrderCore } from './types.js'

const TAG = 'order'

export async function applyOrderCreated(chainId: number, order: OrderCore) {
  void nftCollectionRepo
    .noteNFTCollection({ chainId, address: order.collection })
    .catch(err => console.error(`[${TAG}:created] noteCollection failed`, err))
}

export async function applyOrderFilled(chainId: number, orderHash: Hex) {
  const repo = orderRepoFor(chainId)

  // order not registered ? skip
  const orderRecord = await repo.findByHash(orderHash)
  if (!orderRecord) return

  // === mark order as filled ===

  try {
    await repo.markFilled(orderHash)
  } catch (err) {
    throw new Error(`[${TAG}:filled] markFilled failed`, { cause: err })
  }
}
