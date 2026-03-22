import { nfts } from '#app/db/collections.js'

import type { NFT, NFTKey, NFTMeta } from '#app/domain/nft/model.js'
import type { NFTPort } from '#app/domain/nft/port.js'
import { Status } from '#app/domain/shared/status.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

// === init common-readers ===

const baseRead = makeReadRepo<NFT, NFTKey>(nfts, k => ({
  chainId: k.chainId,
  collection: k,
  tokenId: k.tokenId,
}))

const write = makeTsWrite<NFT>(nfts)

export const nftRepo: NFTPort = {
  // === read ===
  ...baseRead,

  findPendingMeta: function (chainId: number, limit: number): Promise<NFT[]> {
    return nfts().find({ chainId, metaStatus: Status.PENDING }).limit(limit).toArray()
  },

  // === write ===
  async ensure(key: NFTKey, createdAtBlock: number): Promise<{ key: NFTKey; didUpsert: boolean }> {
    const { chainId, collection, tokenId } = key

    const res = await write.updateOne(
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

  async finalizeMeta({ chainId, collection, tokenId, meta }: NFTKey & { meta: Partial<NFTMeta> }) {
    await write.updateOne(
      { chainId, collection, tokenId },
      {
        $set: {
          ...meta,
          metaStatus: Status.DONE,
        },
      }
    )
  },

  async markMetaFailed({ chainId, collection, tokenId, error }: NFTKey & { error: string }) {
    await write.updateOne(
      { chainId, collection, tokenId },
      {
        $set: {
          metaStatus: Status.FAILED,
          metaError: error,
        },
      }
    )
  },
}
