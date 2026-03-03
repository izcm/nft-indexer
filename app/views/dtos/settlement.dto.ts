import type { Settlement } from '#app/domain/settlement/model.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'

export type SettlementDTO = {
  chainId: number
  txHash: string
  orderHash: string
  seller: string
  buyer: string
  collection: string
  tokenId: string
  currency: string
  price: string
  timestamp: number
  executionDetails: Settlement['execution']
}

export const settlementDTO = {
  from(s: Settlement): SettlementDTO {
    return {
      chainId: s.chainId,
      txHash: s.execution.txHash,

      orderHash: s.orderHash,

      seller: s.seller,
      buyer: s.buyer,

      collection: s.collection,
      tokenId: s.tokenId,

      currency: s.currency,
      price: s.price,

      timestamp: secondsToUnixMs(s.execution.block.timestamp),

      executionDetails: s.execution,
    }
  },
}

export const toSettlementDTO = settlementDTO.from
