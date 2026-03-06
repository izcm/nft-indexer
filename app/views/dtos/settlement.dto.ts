import type { Settlement, SettlementCall } from '#app/domain/settlement/model.js'
import { BlockRef, Hash } from '#app/domain/shared/types/eth.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'

export type SettlementDTO = {
  id: string

  chainId: number
  orderHash: string

  txHash: string

  seller: string
  buyer: string

  collection: string
  tokenId: string

  currency: string
  price: string

  timestamp: number

  executionDetails: {
    logIndex: number
    txHash: Hash
    block: BlockRef

    call?: SettlementCall
  }
}

export const settlementDTO = {
  from(s: Settlement): SettlementDTO {
    return {
      id: `${s.chainId}:${s.orderHash}`,

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

      executionDetails: {
        logIndex: s.execution.logIndex,
        txHash: s.execution.txHash,
        block: s.execution.block,
        call: s.execution.callReconstruction.data,
      },
    }
  },
}

export const toSettlementDTO = settlementDTO.from
