import { settlementFromLog as fromLog } from './logic.js'
import { ListenerItem } from '../types/context.js'
import { applySettlementCreated } from '#app/domain/settlement/actions.js'
import { settlementRepo as repo } from '#app/repos/settlement.repo.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = fromLog(item.log, item.chainId)

  void repo.save(settlement)
  void applySettlementCreated({ ...settlement, timestamp: item.log.blockTimestamp })
}
