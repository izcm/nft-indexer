import type { Hex } from 'viem'
import type { Settlement } from '#app/domain/settlement/types.js'
import { Status } from '#app/domain/shared/status.js'

export type SettlementLog = {
  eventName: 'Settlement'
  args: {
    orderHash: Hex
    collection: Hex
    tokenId: bigint
    seller: Hex
    buyer: Hex
    currency: Hex
    price: bigint
  }
  blockNumber: bigint
  blockTimestamp: bigint
  transactionHash: Hex
  logIndex: bigint
}

export const settlementFromLog = (log: SettlementLog, chainId: number): Settlement => {
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

    ingestedAt: 0,
  }
}
