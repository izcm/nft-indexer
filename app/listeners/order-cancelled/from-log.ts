import type { Address, ChainEvent, Hash } from '#app/domain/shared/types/eth.js'
import { chainEventFromBaseLog } from '../shared/from-base-log.js'
import { BaseLog } from '../shared/types.js'
import { orderActions } from '#app/di/write.js'

type OrderCancelledLog = BaseLog & {
  eventName: 'OrderCancelled'
  args: {
    user: Address
    nonce: bigint
  }
}

export function isOrderCancelledLog(log: any): log is OrderCancelledLog {
  return log?.eventName === 'OrderCancelled'
}

export function cancellationFromLog(
  log: OrderCancelledLog,
  chainId: number
): Parameters<(typeof orderActions)['applyOrderCancelled']>[0] {
  const chainEvent = chainEventFromBaseLog(log)
  const { user, nonce } = log.args

  return {
    chainId,
    user,
    nonce: nonce.toString(),
    cancellation: chainEvent,
  }
}
