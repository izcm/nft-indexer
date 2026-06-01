import { Decimal128 } from 'mongodb'

import { nfts, settlements } from '#app/db/collections.js'

import type { SettlementCall, SettlementKey } from '#app/domain/settlement/model.js'
import type { SettlementPort } from '#app/domain/settlement/port.js'
import type { Hash } from '#app/domain/shared/types/eth.js'
import { Status } from '#app/domain/shared/status.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

import { SettlementDoc } from './model/docs.js'
import { SETTLEMENT_FIELD_TRANSFORMS } from './model/field-config.js'

// === helpers ===

const cr = 'execution.callReconstruction'

const crPaths = {
  status: cr + '.status',
  error: cr + '.error',
  data: cr + '.data',
  txContext: cr + '.data.txContext',
}

const baseRead = makeReadRepo<SettlementDoc, SettlementKey>(
  settlements,
  k => ({
    chainId: k.chainId,
    orderHash: k.orderHash,
  }),
  SETTLEMENT_FIELD_TRANSFORMS
)

const write = makeTsWrite(settlements)

export const settlementRepo: SettlementPort = {
  // === read ===

  ...baseRead,

  findPendingCallReconstruction(chainId, limit) {
    return settlements()
      .find({ chainId, 'execution.callReconstruction.status': 'PENDING' })
      .limit(limit)
      .toArray()
  },

  // === write ===

  async save(settlement) {
    const nft = await nfts().findOne({
      chainId: settlement.chainId,
      collection: settlement.collection,
      tokenId: settlement.tokenId,
    })

    // fetch nft
    return settlements().insertOne({
      ...settlement,

      createdAt: Date.now(),
      updatedAt: Date.now(),

      // nft attributes for pagination filters
      attributes: nft?.attributes,

      db: {
        price: Decimal128.fromString(settlement.price),
      },
    })
  },

  async finalizeCallReconstruction({ chainId, orderHash, meta }) {
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

  async markCallReconstructionFailed({ chainId, orderHash, error }) {
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
