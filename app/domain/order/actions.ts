import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepo } from '#app/repos/order.repo.js'
import type { NFTCollectionKey } from '../nft-collection/model.js'
import { InvalidOrderError } from '../shared/errors.js'
import { validOrder } from './rules.js'
import type { Order } from './model.js'

const TAG = 'order'

// === PRIMARY ACTIONS ===

export async function ingestOrder(chainId: number, order: Order) {
  if (!validOrder(order)) {
    throw new InvalidOrderError()
  }

  // Ensure orderHash is valid before saving
  // Note: You'll need to get orderHash from somewhere - add it as a parameter or derive it

  const { id, didUpsert } = await orderRepo.ensure(chainId, order)

  void onOrderCreated({ chainId, address: order.collection })

  return { id, didUpsert }
}

// === SECONDARY ACTIONS ===

export async function onOrderCreated({ chainId, address }: NFTCollectionKey) {
  void nftCollectionRepo
    .noteNFTCollection({ chainId, address })
    .catch(err => console.error(`[${TAG}:created] failed to note NFT collection`, err))
}
