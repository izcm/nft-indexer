import { settlements } from '#app/db/collections.js'

import type { Settlement, SettlementCall, SettlementKey } from '#app/domain/settlement/model.js'
import type { SettlementPort } from '#app/domain/settlement/port.js'
import type { Hash } from '#app/domain/shared/types/eth.js'
import { Status } from '#app/domain/shared/status.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

// === helpers ===

const cr = 'execution.callReconstruction'

const crPaths = {
  status: cr + '.status',
  error: cr + '.error',
  data: cr + '.data',
  txContext: cr + '.data.txContext',
}

const baseRead = makeReadRepo<Settlement, SettlementKey>(settlements, k => ({
  chainId: k.chainId,
  orderHash: k.orderHash,
}))

const write = makeTsWrite(settlements)

export const settlementRepo: SettlementPort = {
  // === read ===

  ...baseRead,

  findPendingCallReconstruction(chainId: number, limit: number) {
    return settlements()
      .find({ chainId, 'execution.callReconstruction.status': 'PENDING' })
      .limit(limit)
      .toArray()
  },

  // === write ===

  save(settlement: Settlement) {
    return settlements().insertOne({
      ...settlement,

      // todo: make 'write' implement insertOne
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },

  async finalizeCallReconstruction({
    chainId,
    orderHash,
    meta,
  }: SettlementKey & { meta: SettlementCall }) {
    await write.updateOne(
      { chainId, orderHash },
      {
        $set: {
          [crPaths.data]: meta,
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
    await write.updateOne(
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
