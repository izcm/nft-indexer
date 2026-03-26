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

  callReconstructed: boolean
  txInputs?: {
    order?: {
      signer: string
      collection: string
      tokenId: string
      currency: string
      price: string
      start: string
      end: string
      nonce: string
    }
    fill?: {
      tokenId: string
      actor: string
    }
    gasUsed?: string
    gasPrice?: string
  }
}

export const settlementDTO = {
  from(s: Settlement): SettlementDTO {
    const call = s.execution.callReconstruction.data
    const reconstructed = s.execution.callReconstruction.status === Status.DONE

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

      callReconstructed: reconstructed,
      ...(reconstructed && call
        ? {
            txInputs: {
              order: {
                signer: call.txInput.signer,
                collection: call.txInput.order.collection,
                tokenId: call.txInput.order.tokenId,
                currency: call.txInput.order.currency,
                price: call.txInput.order.price,
                start: call.txInput.order.start,
                end: call.txInput.order.end,
                nonce: call.txInput.order.nonce,
              },
              fill: {
                tokenId: call.txInput.fill.tokenId,
                actor: call.txInput.fill.actor,
              },
              gasUsed: call.txContext.gasUsed.toString(),
              gasPrice: call.txContext.effectiveGasPrice.toString(),
            },
          }
        : {}),
    }
  },
}

export const toSettlementDTO = settlementDTO.from
