import type { BlockTime, TxContext } from '#app/domain/shared/eth.js'
import type { OrderCore, OrderType, Signature } from '../order/types.js'
import { Side } from '../order/types.js'
import { Status } from '../shared/status.js'
import type { Address, Hash } from '../shared/eth.js'

export type SettlementKey = {
  chainId: number
  orderHash: Hash
}

export const settlementKeyOf = (settlement: Settlement): SettlementKey => ({
  chainId: settlement.chainId,
  orderHash: settlement.orderHash,
})

export type Settlement = {
  chainId: number
  orderHash: Hash

  collection: Address
  tokenId: string

  seller: Address
  buyer: Address

  currency: Address
  price: string

  execution: {
    logIndex: number
    txHash: Hash
    block: BlockTime

    callReconstruction: {
      status: Status
      error?: string
      data?: SettlementCall
    }
  }

  ingestedAt: number
}

// atomic metadata eg. fetched in one request ( no partial data )
export type SettlementCall = {
  txContext: TxContext

  txInput: {
    order: OrderCore
    fill: Fill
    signer: Address
  }
}

// todo: this should be in some shared package a2z/packages
export type Fill = {
  tokenId: string
  actor: Address
}
