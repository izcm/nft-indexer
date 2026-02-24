import { NFTCollectionKey, nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { OrderKey, orderRepoFor } from '#app/repos/order.repo.js'

const TAG = 'order'

export async function ingestOrder() {}

export async function onOrderCreated({ chainId, address }: NFTCollectionKey) {
  void nftCollectionRepo
    .noteNFTCollection({ chainId, address })
    .catch(err => console.error(`[${TAG}:created] noteCollection failed`, err))
}

export async function onOrderFilled({ chainId, orderHash }: OrderKey) {
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
