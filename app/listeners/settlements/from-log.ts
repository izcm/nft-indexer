import type { Settlement } from '#app/domain/settlement/model.js'
import type { Address, Hash } from '#app/domain/shared/types/eth.js'
import { Status } from '#app/domain/shared/status.js'

import { chainEventFromBaseLog } from '../shared/from-base-log.js'
import { BaseLog } from '../shared/types.js'

export type SettlementLog = BaseLog & {
  eventName: 'Settlement'
  args: {
    orderHash: Hash
    collection: Address
    tokenId: bigint
    seller: Address
    buyer: Address
    currency: Address
    price: bigint
  }
}

export function isSettlementLog(log: any): log is SettlementLog {
  return log?.eventName === 'Settlement'
}

export function settlementFromLog(log: SettlementLog, chainId: number): Settlement {
  const { args } = log

  const chainEvent = chainEventFromBaseLog(log)

  return {
    chainId: chainId,
    orderHash: args.orderHash,

    collection: args.collection,
    tokenId: args.tokenId.toString(),

    seller: args.seller,
    buyer: args.buyer,

    currency: args.currency,
    price: args.price.toString(),

    execution: {
      ...chainEvent,

      callReconstruction: {
        status: Status.PENDING,
      },
    },

    updatedAt: 0,
    createdAt: 0,
  }
}
