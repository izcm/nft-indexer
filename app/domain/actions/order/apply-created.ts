import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { OrderCore } from '../../types/order.js'

export async function applyOrderCreated(
  chainId: number,
  order: OrderCore,
  opts?: { waitForStats?: boolean }
) {
  const tag = 'order:created'

  void nftCollectionRepo
    .noteCollection(chainId, order.collection)
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))
}
