// order types & methods
// context types
import type { SettlementLog } from '../types/logs.js'

// domain types
import type { Settlement } from '#app/domain/settlement/types.js'

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
    },

    metaStatus: 'PENDING',
    ingestedAt: 0,
  }
}
