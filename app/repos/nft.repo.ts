import { nfts } from '#app/db/collections.js'
import type { NFT, NFTKey } from '#app/domain/nft/model.js'
import { NFTPort } from '#app/domain/nft/port.js'

import { makeReadRepo } from './read-commons.repo.js'

// === init common-readers ===

const baseRead = makeReadRepo<NFT, NFTKey>(nfts, k => ({
  chainId: k.chainId,
  address: k,
  tokenId: k.tokenId,
}))

export const nftRepo: NFTPort = {
  // === read ===
  ...baseRead,

  findMissingChainMeta: function (chainId: number, limit: number): Promise<NFT[]> {
    throw new Error('Function not implemented.')
  },

  // === write ===
  ensure(nft: NFT): Promise<{ key: NFTKey; didUpsert: boolean }> {
    throw new Error('Function not implemented.')
  },
}
