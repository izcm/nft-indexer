import { settlements } from '#app/db/collections.js'
import type { Settlement, SettlementCall } from '#app/domain/settlement/types.js'
import type { Hash } from '#app/domain/shared/types.js'
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

  async findPendingCallReconstruction(chainId: number, limit: number) {
    return settlements()
      .find({ chainId, 'execution.callReconstruction.status': 'PENDING' })
      .limit(limit)
      .toArray()
  },

  // === write ===

  // settlement should never be overwritten => insertOne + unique indexes
  async save(settlement: Settlement) {
    return settlements().insertOne({
      ...settlement,
      ingestedAt: Date.now(),
    })
  },

  async finalizeCallReconstruction({
    chainId,
    orderHash,
    meta,
  }: SettlementKey & { meta: SettlementCall }) {
    return settlements().updateOne(
      { chainId, orderHash },
      {
        $set: {
          'execution.txContext': meta['txContext'],
          'execution.callReconstruction.status': 'DONE',
        },
      }
    )
  },

  async markCallReconstructionFailed({
    chainId,
    orderHash,
    error,
  }: SettlementKey & { error: string }) {
    return settlements().updateOne(
      { chainId, orderHash },
      {
        $set: {
          'execution.callReconstruction.status': 'FAILED',
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
    return settlementRepo.findPendingCallReconstruction(chainId, limit)
  },

  finalizeMeta(orderHash: Hash, meta: SettlementCall) {
    return settlementRepo.finalizeCallReconstruction({ chainId, orderHash, meta })
  },

  markMetaFailed(orderHash: Hash, error: string) {
    return settlementRepo.markCallReconstructionFailed({ chainId, orderHash, error })
  },
})
