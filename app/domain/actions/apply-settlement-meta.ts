import { Hex } from 'viem'

import { Settlement, SettlementMeta } from '../types/settlement.js'

import { settlementRepoFor } from '#app/repos/settlement.repo.js'
import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'

import { applyOrderFilled } from './apply-order-filled.js'

export async function applySettlementMeta(settlement: Settlement, meta: SettlementMeta) {
  const { chainId, orderHash, collection, price, execution } = settlement
  const { timestamp } = execution.block

  // === finalize settlement meta ===

  const settlementRepo = settlementRepoFor(chainId)

  try {
    await settlementRepo.finalizeMeta(orderHash, meta)
  } catch (err) {
    throw new Error('[stats:settlement] finalizeMeta failed', { cause: err })
  }

  // == mark order filled ===

  await applyOrderFilled(chainId, orderHash, timestamp)

  // == update stats  ===

  void statsRepo
    .recordSettlement({ chainId, collection, timestamp, price })
    .catch(err => console.error('[settlement]: recordSettlement failed', err))
}
