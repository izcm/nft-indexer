import { ListenerItem } from '../types/context.js'
import { applySettlementCreated, applySettlementObserved } from '#app/domain/settlement/actions.js'
import { settlementFromLog } from './logic.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'

export async function handleSettlement(item: ListenerItem) {
  const settlement = settlementFromLog(item.log, item.chainId)

  // todo. increment cursor (polling) if success
  await applySettlementObserved(settlement)
}
