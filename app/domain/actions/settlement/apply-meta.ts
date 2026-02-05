import { Settlement, SettlementMeta } from '../../types/settlement.js'

import { settlementRepoFor } from '#app/repos/settlement.repo.js'

/**
 * @param settlement the full settlement record
 * @param meta pre-formatted settlement metadata
 */
export async function applySettlementMeta(settlement: Settlement, meta: SettlementMeta) {
  const { chainId, orderHash, collection, price, execution } = settlement
  const { timestamp } = execution.block

  const settlementRepo = settlementRepoFor(chainId)

  try {
    await settlementRepo.finalizeMeta(orderHash, meta)
  } catch (err) {
    throw new Error('[settlement:meta] finalizeMeta failed', { cause: err })
  }
}
