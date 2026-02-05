import { Hex } from 'viem'

import { Settlement, SettlementMeta } from '../types/settlement.js'

import { settlementRepoFor } from '#app/repos/settlement.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'
import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'

export async function applySettlementMeta(settlement: Settlement, meta: SettlementMeta) {
  const { chainId, orderHash, collection, price, execution } = settlement
  const { timestamp } = execution.block

  const settlementRepo = settlementRepoFor(chainId)
  const orderRepo = orderRepoFor(chainId)

  try {
    await settlementRepo.finalizeMeta(orderHash, meta)
  } catch (err) {
    throw new Error('[settlement] finalizeMeta failed', { cause: err })
  }

  try {
    await orderRepo.markFilled(orderHash)
  } catch (err) {
    throw new Error('[settlement] markFilled failed', { cause: err })
  }

  void statsRepo.recordSettlement({ chainId, collection, timestamp, price })
}
