import { settlementActions as actions } from '#app/di/write.js'

import { ListenerItem } from '../index.js'
import { settlementFromLog } from './logic.js'

export async function handleSettlement(item: ListenerItem) {
  const settlement = settlementFromLog(item.log, item.chainId)
  await actions.ingestSettlement(settlement)
}
