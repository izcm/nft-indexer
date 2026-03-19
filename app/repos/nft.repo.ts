import { nfts } from '#app/db/collections.js'

import type { NFT, NFTKey } from '#app/domain/nft/model.js'
import type { NFTPort } from '#app/domain/nft/port.js'
import { Status } from '#app/domain/shared/status.js'

import { makeReadRepo } from './shared/_read.js'

// === init common-readers ===

const baseRead = makeReadRepo<NFT, NFTKey>(nfts, k => ({
  chainId: k.chainId,
  collection: k,
  tokenId: k.tokenId,
}))

export const nftRepo: NFTPort = {
  // === read ===
  ...baseRead,

  findPendingMeta: function (chainId: number, limit: number): Promise<NFT[]> {
    return nfts().find({ chainId }).limit(limit).toArray()
  },

  // === write ===
  async ensure(key: NFTKey, createdAtBlock: number): Promise<{ key: NFTKey; didUpsert: boolean }> {
    const { chainId, collection, tokenId } = key

    const res = await nfts().updateOne(
      {
        chainId,
        collection,
        tokenId,
      },
      {
        $setOnInsert: {
          chainId,
          collection,
          tokenId,
          createdAtBlock,
          metaStatus: Status.PENDING,
        },
      },
      {
        upsert: true,
      }
    )

    return { key: { chainId, collection, tokenId }, didUpsert: !!res.upsertedCount }
  },
}
