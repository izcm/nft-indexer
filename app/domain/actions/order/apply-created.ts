import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { OrderCore } from '../../types/order.js'

const TAG = 'order:created'

export async function applyOrderCreated(chainId: number, order: OrderCore) {
  void nftCollectionRepo
    .noteCollection(chainId, order.collection)
    .catch(err => console.error(`[${TAG}] noteCollection failed`, err))
}
