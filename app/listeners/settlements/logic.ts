// order types & methods
import { OrderCore, OrderSignature, Side, SideLabel } from '#app/domain/types/order.js'

// context types
import { SettlementLog } from '../types/logs.js'

// domain types
import { Settlement } from '#app/domain/types/settlement.js'

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
