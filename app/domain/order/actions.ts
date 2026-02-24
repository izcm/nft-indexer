import { NFTCollectionKey, nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { OrderKey, orderRepoFor } from '#app/repos/order.repo.js'

const TAG = 'order'

// === INGESTION ===

export async function ingestOrder() {}

// === REACTIONS ===

export async function onOrderCreated({ chainId, address }: NFTCollectionKey) {
  void nftCollectionRepo
    .noteNFTCollection({ chainId, address })
    .catch(err => console.error(`[${TAG}:created] failed to note NFT collection`, err))
}
