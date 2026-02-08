import { ObjectId } from 'mongodb'
import { Hex } from 'viem'

import { nftCollections } from '#app/db/mongo.js'
import { NFTCollectionChainMeta, NFTCollectionMetaPatch } from '#app/domain/types/nft-collection.js'
import { Status } from '#app/domain/constants/db.js'

const seenCollections = new Set<string>()

export const __resetSeenCollectionsForTest = () => {
  seenCollections.clear()
}

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

    return nftCollections().updateOne(
      { chainId, address },
      {
        $setOnInsert: {
          chainId,
          address,
          metaStatus: Status.PENDING,
          chainMetaStatus: Status.PENDING,
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

  async findByChainIdAndAddress(chainId: number, address: Hex) {
    return nftCollections().findOne({ chainId, address })
  },

  async findMissingChainMeta(chainId: number, limit: number) {
    return nftCollections()
      .find({ chainId: chainId, chainMetaStatus: Status.PENDING })
      .limit(limit)
      .toArray()
  },

  // === write ===

  async finalizeChainMeta(
    chainId: number,
    address: Hex,
    chainMeta: Partial<NFTCollectionChainMeta>
  ) {
    return nftCollections().updateOne(
      { chainId, address },
      {
        $set: {
          ...chainMeta,
          chainMetaStatus: Status.DONE,
          updatedAt: Date.now(),
        },
      }
    )
  },

  async markChainMetaFailed(chainId: number, address: Hex, err: string) {
    return nftCollections().updateOne(
      { chainId, address },
      {
        $set: {
          chainMetaStatus: Status.FAILED,
          chainMetaError: err,
          updatedAt: Date.now(),
        },
      }
    )
  },

  async patchMeta(chainId: number, address: Hex, patch: NFTCollectionMetaPatch) {
    return nftCollections().updateOne(
      { chainId, address },
      {
        $set: {
          ...patch,
          updatedAt: Date.now(),
        },
      }
    )
  },
}

/**
 * WRAPPER
 * - Prettifies multichain code
 */

export const nftCollectionRepoFor = (chainId: number) => ({
  findMissingChainMeta(limit: number) {
    return nftCollectionRepo.findMissingChainMeta(chainId, limit)
  },

  finalizeChainMeta(address: Hex, chainMeta: Partial<NFTCollectionChainMeta>) {
    return nftCollectionRepo.finalizeChainMeta(chainId, address, chainMeta)
  },

  markChainMetaFailed(address: Hex, err: string) {
    return nftCollectionRepo.markChainMetaFailed(chainId, address, err)
  },

  patchMeta(address: Hex, patch: NFTCollectionMetaPatch) {
    return nftCollectionRepo.patchMeta(chainId, address, patch)
  },
})
