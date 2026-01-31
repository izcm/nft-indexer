// order types & methods
import { OrderCore, OrderSignature, Side, SideLabel } from '#app/domain/types/order.js'

// context types
import { SettlementLog } from '../types/logs.js'

// domain types
import { Settlement } from '#app/domain/types/settlement.js'

export const settlementFromLog = (log: SettlementLog, chainId: number): Settlement => {
  const { args } = log

  return {
    orderHash: args.orderHash,
    collection: args.collection,
    tokenId: args.tokenId.toString(),
    seller: args.seller,
    buyer: args.buyer,
    currency: args.currency,
    priceWei: args.price.toString(),

    execution: {
      chainId: chainId,
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
