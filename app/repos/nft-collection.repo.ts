import { ObjectId } from 'mongodb'
import { Hex } from 'viem'

import { nftCollections } from '#app/db/mongo.js'
import { NFTCollectionMetaPatch } from '#app/domain/types/nft-collection.js'

export const nftCollectionRepo = {
  // === read ===

  async findById(id: ObjectId) {
    return nftCollections().findOne({ _id: id })
  },

  async findMissingBaseMeta(limit: number) {
    return nftCollections()
      .find({ baseMetaFetched: false, metaStatus: 'PENDING' })
      .limit(limit)
      .toArray()
  },

  // === write ===

  async save(chainId: number, address: Hex) {
    return nftCollections().insertOne
  },

  async patchMeta(chainId: number, address: Hex, patch: NFTCollectionMetaPatch) {
    await nftCollections().updateOne(
      { chainId, address },
      {
        $set: patch,
        updatedAt: Date.now(),
      }
    )
  },
}
