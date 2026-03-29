import { orderActions as actions } from '#app/di/write.js'

import { ListenerItem } from '../shared/types.js'
import { cancellationFromLog, isOrderCancelledLog } from './from-log.js'

export async function handleOrderCancelled(item: ListenerItem) {
  if (!isOrderCancelledLog(item.log)) return

  const cancellation = cancellationFromLog(item.log, item.chainId)
  actions.applyOrderCancelled({ ...cancellation })
}
