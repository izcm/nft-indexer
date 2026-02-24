import { settlements } from '#app/db/collections.js'
import type { Settlement, SettlementMeta } from '#app/domain/settlement/types.js'
import type { Hash } from '#app/domain/shared/eth.js'
import type { ObjectId } from 'mongodb'
import { findPageGeneric } from './_shared/paginate.js'
import type { FindPageArgs } from './_shared/types.js'

export type SettlementKey = {
  chainId: number
  orderHash: Hash
}

export const settlementRepo = {
  // === read ===

  async findById(id: ObjectId) {
    return settlements().findOne({ _id: id })
  },

  async findByKey(key: SettlementKey) {
    const { chainId, orderHash } = key
    return settlements().findOne({ chainId, orderHash })
  },

  async findPage({ filters = {}, from, to, cursor, sortField, sortDir, limit }: FindPageArgs) {
    const blockTs = 'execution.block.timestamp'
    const query = { ...filters }

    if (from || to) {
      query[blockTs] = {}
      if (from) query[blockTs].$gte = from
      if (to) query[blockTs].$lte = to
    }

    return findPageGeneric({
      dbCollection: settlements(),
      baseQuery: query,
      sortField,
      sortDir,
      cursor,
      limit,
    })
  },

  async findPendingMeta(chainId: number, limit: number) {
    return settlements().find({ chainId, metaStatus: 'PENDING' }).limit(limit).toArray()
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

  finalizeMeta(orderHash: Hash, meta: SettlementMeta) {
    return settlementRepo.finalizeMeta({ chainId, orderHash, meta })
  },

  markMetaFailed(orderHash: Hash, error: string) {
    return settlementRepo.markMetaFailed({ chainId, orderHash, error })
  },
})
