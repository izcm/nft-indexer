import { settlementFromLog as fromLog } from './logic.js'
import { ListenerItem } from '../types/context.js'
import { applySettlementCreated } from '#app/domain/settlement/actions.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = fromLog(item.log, item.chainId)
  void applySettlementCreated({ ...settlement, timestamp: item.log.blockTimestamp })
}
