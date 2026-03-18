import { nftCollections } from '#app/db/collections.js'

import type {
  NFTCollection,
  NFTCollectionChainMeta,
  NFTCollectionKey,
  NFTCollectionMetaPatch,
} from '#app/domain/nft-collection/model.js'
import type { NFTCollectionPort } from '#app/domain/nft-collection/port.js'

import type { Address } from '#app/domain/shared/types/eth.js'
import { Status } from '#app/domain/shared/status.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

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

// === init write helper ===

const write = makeTsWrite(nftCollections)

export const nftCollectionRepo: NFTCollectionPort = {
  // === read ===

  ...baseRead,

  findMissingChainMeta(chainId: number, limit: number) {
    return nftCollections()
      .find({ chainId, chainMetaStatus: Status.PENDING })
      .limit(limit)
      .toArray()
  },

  findBackfillNotDone(chainId: number, limit: number): Promise<NFTCollection[]> {
    return nftCollections().find({ chainId, backfillDone: false }).limit(limit).toArray()
  },

  // === write ===

  async noteNFTCollection(key: NFTCollectionKey) {
    const { chainId, address } = key

    const cacheKey = stringifyKey(key)
    if (seenCollections.has(cacheKey)) return

    seenCollections.add(cacheKey)

    await write.updateOne(
      { chainId, address },
      {
        $setOnInsert: {
          chainId,
          address,

          metaStatus: Status.PENDING,
          chainMetaStatus: Status.PENDING,

          lastScannedBlock: 0,
          backfillDone: false,
        },
      },
      { upsert: true }
    )
  },

  async finalizeChainMeta({
    chainId,
    address,
    chainMeta,
  }: NFTCollectionKey & { chainMeta: Partial<NFTCollectionChainMeta> }) {
    await write.updateOne(
      { chainId, address },
      {
        $set: {
          ...chainMeta,
          chainMetaStatus: Status.DONE,
        },
      }
    )
  },

  async markChainMetaFailed({ chainId, address, error }: NFTCollectionKey & { error: string }) {
    await write.updateOne(
      { chainId, address },
      {
        $set: {
          chainMetaStatus: Status.FAILED,
          chainMetaError: error,
        },
      }
    )
  },

  async updateLastScannedBlock({ chainId, address, block }: NFTCollectionKey & { block: number }) {
    await nftCollections().updateOne({ chainId, address }, { $set: { lastScannedBlock: block } })
  },

  async patchMeta({
    chainId,
    address,
    patch,
  }: NFTCollectionKey & { patch: NFTCollectionMetaPatch }) {
    await write.updateOne(
      { chainId, address },
      {
        $set: {
          ...patch,
        },
      }
    )
  },
}
