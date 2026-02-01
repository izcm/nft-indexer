import { dbNFTCollections } from '#app/db/mongo.js'
import { NFTCollectionMetaPatch } from '#app/domain/types/nft-collection.js'
import { ObjectId } from 'mongodb'
import { Hex } from 'viem'

export const nftCollectionRepo = {
  // === write ===
  async findById(id: ObjectId) {
    return dbNFTCollections().findOne({ _id: id })
  },

  async patchMeta(chainId: number, address: Hex, patch: NFTCollectionMetaPatch) {
    await dbNFTCollections().updateOne(
      { chainId, address },
      {
        $set: patch,
        updatedAt: Date.now(),
      }
    )
  },
}
