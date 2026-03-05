import { ObjectId } from 'mongodb'
import { nftCollections } from '#app/db/collections.js'

import type {
  NFTCollection,
  NFTCollectionChainMeta,
  NFTCollectionKey,
  NFTCollectionMetaPatch,
} from '#app/domain/nft-collection/model.js'
import type { NFTCollectionPort } from '#app/domain/nft-collection/port.js'

import type { Address } from '#app/domain/shared/types/eth.js'
import type { ById } from '#app/domain/shared/interfaces/read-commons.js'
import { Status } from '#app/domain/shared/status.js'

import { makeReadRepo } from './read-commons.repo.js'

// === cache ===

const seenCollections = new Set<string>()

export const __resetSeenCollectionsForTest = () => {
  seenCollections.clear()
}

const stringifyKey = (key: NFTCollectionKey) => {
  return `${key.chainId}:${key.address.toLowerCase()}`
}

// === init common-readers ===

const baseRead = makeReadRepo<NFTCollection, NFTCollectionKey>(nftCollections, k => ({
  chainId: k.chainId,
  address: k.address,
}))

export const nftCollectionRepo: NFTCollectionPort & ById<NFTCollection, ObjectId> = {
  // === read ===
  ...baseRead,

  // === write ===
  async noteNFTCollection(key: NFTCollectionKey) {
    const { chainId, address } = key

    const cacheKey = stringifyKey(key)
    if (seenCollections.has(cacheKey)) return

    seenCollections.add(cacheKey)

    await nftCollections().updateOne(
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

  findMissingChainMeta(chainId: number, limit: number) {
    return nftCollections()
      .find({ chainId, chainMetaStatus: Status.PENDING })
      .limit(limit)
      .toArray()
  },

  // === write ===

  async finalizeChainMeta({
    chainId,
    address,
    chainMeta,
  }: NFTCollectionKey & { chainMeta: Partial<NFTCollectionChainMeta> }) {
    await nftCollections().updateOne(
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

  async markChainMetaFailed({ chainId, address, error }: NFTCollectionKey & { error: string }) {
    await nftCollections().updateOne(
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

  async patchMeta({
    chainId,
    address,
    patch,
  }: NFTCollectionKey & { patch: NFTCollectionMetaPatch }) {
    await nftCollections().updateOne(
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
