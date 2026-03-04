import { ObjectId } from 'mongodb'
import { nftCollections } from '#app/db/collections.js'
import type {
  NFTCollectionChainMeta,
  NFTCollectionKey,
  NFTCollectionMetaPatch,
} from '#app/domain/nft-collection/model.js'
import { Status } from '#app/domain/shared/status.js'
import type { Address } from '#app/domain/shared/types/eth.js'

const stringifyKey = (key: NFTCollectionKey) => {
  return `${key.chainId}:${key.address.toLowerCase()}`
}

// === cache ===

const seenCollections = new Set<string>()

export const __resetSeenCollectionsForTest = () => {
  seenCollections.clear()
}

export const nftCollectionRepo = {
  // === helpers ===

  /**
   * Ensures the collection exists
   * Avoids repeated DB upserts using in-memory tracking
   */

  noteNFTCollection(key: NFTCollectionKey) {
    const { chainId, address } = key

    const cacheKey = stringifyKey(key)
    if (seenCollections.has(cacheKey)) return

    seenCollections.add(cacheKey)

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

  findById(id: ObjectId) {
    return nftCollections().findOne({ _id: id })
  },

  findByKey(key: NFTCollectionKey) {
    const { chainId, address } = key
    return nftCollections().findOne({ chainId, address })
  },

  findByKeys(keys: NFTCollectionKey[]) {
    if (!keys.length) return []

    return nftCollections()
      .find({ $or: keys.map(k => ({ chainId: k.chainId, address: k.address })) })
      .toArray()
  },

  findMissingChainMeta(chainId: number, limit: number) {
    return nftCollections()
      .find({ chainId: chainId, chainMetaStatus: Status.PENDING })
      .limit(limit)
      .toArray()
  },

  // === write ===

  finalizeChainMeta({
    chainId,
    address,
    chainMeta,
  }: NFTCollectionKey & { chainMeta: Partial<NFTCollectionChainMeta> }) {
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

  markChainMetaFailed({ chainId, address, error }: NFTCollectionKey & { error: string }) {
    return nftCollections().updateOne(
      { chainId, address },
      {
        $set: {
          chainMetaStatus: Status.FAILED,
          chainMetaError: error,
          updatedAt: Date.now(),
        },
      }
    )
  },

  patchMeta({ chainId, address, patch }: NFTCollectionKey & { patch: NFTCollectionMetaPatch }) {
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

  finalizeChainMeta(address: Address, chainMeta: Partial<NFTCollectionChainMeta>) {
    return nftCollectionRepo.finalizeChainMeta({ chainId, address, chainMeta })
  },

  markChainMetaFailed(address: Address, error: string) {
    return nftCollectionRepo.markChainMetaFailed({ chainId, address, error })
  },

  patchMeta(address: Address, patch: NFTCollectionMetaPatch) {
    return nftCollectionRepo.patchMeta({ chainId, address, patch })
  },
})
