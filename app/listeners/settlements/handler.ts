import { settlementFromLog as fromLog } from './logic.js'

import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collections/collection.repo.js'

import { ListenerItem } from '../types/context.js'
import { nftCollectionStatsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import { applySettlementCreated } from '#app/domain/actions/settlement/apply-created.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = fromLog(item.log, item.chainId)
  void applySettlementCreated(settlement)
}
