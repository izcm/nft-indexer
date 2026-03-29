import { settlementActions as actions } from '#app/di/write.js'

import { ListenerItem } from '../shared/types.js'
import { isSettlementLog, settlementFromLog } from './from-log.js'

export async function handleSettlement(item: ListenerItem) {
  if (!isSettlementLog(item.log)) return

  const settlement = settlementFromLog(item.log, item.chainId)
  await actions.ingestSettlement(settlement)
}
