import type { Settlement, SettlementCall } from '#app/domain/settlement/model.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'
import { Status } from '#app/domain/shared/status.js'

export type SettlementDTO = {
  id: string
  chainId: number
  orderHash: string
  txHash: string

  // NFT details
  collection: string
  tokenId: string

  // Trade participants
  seller: string
  buyer: string

  // Payment
  currency: string
  price: string

  // Block/timing info
  blockNumber: number
  timestamp: number

  // Transaction details
  logIndex: number

  txContext?: {
    txIndex: number
    functionSelector: string
    functionName: string
    contractAddress: string
    gasUsed: number
    gasPrice: number
  }
}

export const settlementDTO = {
  from(s: Settlement): SettlementDTO {
    const call = s.execution.callReconstruction.data
    const isDone = s.execution.callReconstruction.status === Status.DONE

    return {
      id: `${s.chainId}:${s.orderHash}`,
      chainId: s.chainId,
      orderHash: s.orderHash,
      txHash: s.execution.txHash,

      collection: s.collection,
      tokenId: s.tokenId,

      seller: s.seller,
      buyer: s.buyer,

      currency: s.currency,
      price: s.price,

      blockNumber: s.execution.block.number,
      timestamp: secondsToUnixMs(s.execution.block.timestamp),

      logIndex: s.execution.logIndex,

      // 👇 key change: always present, but maybe undefined
      txContext:
        isDone && call
          ? {
              txIndex: call.txContext.index,
              functionSelector: call.txContext.functionSelector,
              functionName: call.txContext.functionName,
              contractAddress: call.txContext.contractAddress ?? '',

              gasUsed: Number(call.txContext.gasUsed),
              gasPrice: Number(call.txContext.effectiveGasPrice),
            }
          : undefined,
    }
  },
}

export const toSettlementDTO = settlementDTO.from
