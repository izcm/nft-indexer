import { Hex } from 'viem'
import { ObjectId } from 'mongodb'

import { settlements } from '#app/db/collections.js'
import { Settlement, SettlementMeta } from '#app/domain/settlement/types.js'
import { FindPageArgs } from './_shared/types.js'
import { findPageGeneric } from './_shared/paginate.js'

type SettlementKey = {
  chainId: number
  orderHash: Hex
}

export const settlementRepo = {
  // === read ===

  async findById(id: ObjectId) {
    return settlements().findOne({ _id: id })
  },

  async findBySettlementKey(key: SettlementKey) {
    const { chainId, orderHash } = key
    return settlements().findOne({ chainId, orderHash })
  },

  async findPendingMeta(chainId: number, limit: number) {
    return settlements().find({ chainId, metaStatus: 'PENDING' }).limit(limit).toArray()
  },

  async findPage({ filters, from, to, cursor, sortField, sortDir, limit }: FindPageArgs) {
    const blockTs = 'execution.block.timestamp'
    const query = { ...filters }

    if (from || to) {
      query[blockTs] = {}
      if (from) query[blockTs].$gte = from
      if (to) query[blockTs].$lte = to
    }

    return findPageGeneric({
      collection: settlements(),
      baseQuery: query,
      sortField,
      sortDir,
      cursor,
      limit,
    })
  },

  // === write ===

  // settlement should never be overwritten => insertOne + unique indexes
  async save(settlement: Settlement) {
    return settlements().insertOne({
      ...settlement,
      ingestedAt: Date.now(),
    })
  },

  async finalizeMeta({ chainId, orderHash, meta }: SettlementKey & { meta: SettlementMeta }) {
    return settlements().updateOne(
      { chainId, orderHash },
      {
        $set: {
          orderAttributes: meta['order'],
          'execution.txContext': meta['txContext'],
          metaStatus: 'DONE',
        },
      }
    )
  },

  async markMetaFailed({ chainId, orderHash, error }: SettlementKey & { error: string }) {
    return settlements().updateOne(
      { chainId, orderHash },
      {
        $set: {
          metaStatus: 'FAILED',
          metaError: error,
        },
      }
    )
  },
}

/**
 * WRAPPER
 * - Prettifies multichain code
 */

export const settlementRepoFor = (chainId: number) => ({
  findPendingMeta(limit: number) {
    return settlementRepo.findPendingMeta(chainId, limit)
  },

  finalizeMeta(orderHash: Hex, meta: SettlementMeta) {
    return settlementRepo.finalizeMeta({ chainId, orderHash, meta })
  },

  markMetaFailed(orderHash: Hex, error: string) {
    return settlementRepo.markMetaFailed({ chainId, orderHash, error })
  },
})
