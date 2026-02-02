import { ObjectId } from 'mongodb'
import { Hex } from 'viem'

import { nftCollections } from '#app/db/mongo.js'
import { NFTCollectionChainMeta, NFTCollectionMetaPatch } from '#app/domain/types/nft-collection.js'

// TODO: may wanna move the state stuff out of repo
const seenCollections = new Set<string>()

const collectionKey = (chainId: number, address: string) => {
  return `${chainId}:${address.toLowerCase()}`
}

export const nftCollectionRepo = {
  // === helpers ===

  /**
   * Ensures the collection exists
   * Avoids repeated DB upserts using in-memory tracking
   */

  async noteCollection(chainId: number, address: Hex) {
    const key = collectionKey(chainId, address)
    if (seenCollections.has(key)) return

    seenCollections.add(key)

    await nftCollections().updateOne(
      { chainId, address },
      {
        $setOnInsert: {
          chainId,
          address,
          metaStatus: 'PENDING',
          chainMetaFetched: false,
          updatedAt: Date.now(),
        },
      },
      { upsert: true }
    )
  },

  // === read ===

  async findById(id: ObjectId) {
    return nftCollections().findOne({ _id: id })
  },

  async findMissingChainMeta(limit: number) {
    return nftCollections()
      .find({ chainMetaFetched: false, metaStatus: 'PENDING' })
      .limit(limit)
      .toArray()
  },

  // === write ===

  async finalizeChainMeta(
    chainId: number,
    address: Hex,
    chainMeta: Partial<NFTCollectionChainMeta>
  ) {
    await nftCollections().updateOne(
      { chainId, address },
      {
        $set: chainMeta,
        updatedAt: Date.now(),
      }
    )
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
