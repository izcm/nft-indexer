import { NFTCollectionKey, nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { OrderKey, orderRepo, orderRepoFor } from '#app/repos/order.repo.js'
import type { Order } from './types.js'

const TAG = 'order'

// === PRIMARY ACTIONS ===

export async function ingestOrder(chainId: number, order: Order) {
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
