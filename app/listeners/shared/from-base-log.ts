import { ChainEvent } from '#app/domain/shared/types/eth.js'
import { BaseLog } from './types.js'

export function chainEventFromBaseLog<T extends BaseLog>(log: T) {
  return {
    block: {
      number: Number(log.blockNumber),
      timestamp: Number(log.blockTimestamp),
    },

    txHash: log.transactionHash,
    logIndex: Number(log.logIndex),
  } satisfies ChainEvent
}
