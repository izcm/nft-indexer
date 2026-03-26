import type { Settlement } from '#app/domain/settlement/model.js'
import type { Address, Hash } from '#app/domain/shared/types/eth.js'
import { Status } from '#app/domain/shared/status.js'

export type SettlementLog = {
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
  blockNumber: bigint
  blockTimestamp: bigint
  transactionHash: Hash
  logIndex: bigint
}

export function settlementFromLog(log: SettlementLog, chainId: number): Settlement {
  const { args } = log

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
      logIndex: Number(log.logIndex),
      txHash: log.transactionHash,

      block: {
        number: Number(log.blockNumber),
        timestamp: Number(log.blockTimestamp),
      },

      callReconstruction: {
        status: Status.PENDING,
      },
    },

    updatedAt: 0,
    createdAt: 0,
  }
}
