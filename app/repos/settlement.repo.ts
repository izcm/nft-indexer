import type { ObjectId, WithId } from 'mongodb'
import { settlements } from '#app/db/collections.js'

import type { Settlement, SettlementCall, SettlementKey } from '#app/domain/settlement/model.js'
import { Status } from '#app/domain/shared/status.js'
import type { Hash } from '#app/domain/shared/types/eth.js'
import { ByKey, ById, Pageable } from '#app/domain/shared/interfaces/read-commons.js'

import { createReadRepo } from './read-commons.repo.js'

// === helpers ===

const crPaths = {
  status: 'execution.callReconstruction.status',
  error: 'execution.callReconstruction.error',
  data: 'execution.callReconstruction.data',
  txContext: 'execution.callReconstruction.data.txContext',
}

type SettlementDoc = WithId<Settlement>

const baseRead = createReadRepo<Settlement, SettlementKey>(settlements, k => ({
  chainId: k.chainId,
  orderHash: k.orderHash,
}))

export type SettlementRepo = ById<SettlementDoc, ObjectId> &
  ByKey<SettlementDoc, SettlementKey> &
  Pageable<SettlementDoc> & {
    findPendingCallReconstruction(chainId: number, limit: number): Promise<Settlement[]>
    save(settlement: Settlement): Promise<any>
    finalizeCallReconstruction(args: SettlementKey & { meta: SettlementCall }): Promise<any>
    markCallReconstructionFailed(args: SettlementKey & { error: string }): Promise<any>
  }

export const settlementRepo: SettlementRepo = {
  // === read ===

  ...baseRead,

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
          [crPaths.txContext]: meta['txContext'],
          [crPaths.status]: Status.DONE,
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
          [crPaths.status]: Status.FAILED,
          [crPaths.error]: error,
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

  finalizeCallReconstruction(orderHash: Hash, meta: SettlementCall) {
    return settlementRepo.finalizeCallReconstruction({ chainId, orderHash, meta })
  },

  markCallReconstructionFailed(orderHash: Hash, error: string) {
    return settlementRepo.markCallReconstructionFailed({ chainId, orderHash, error })
  },
})
