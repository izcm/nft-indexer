import type { BlockTime, TxContext } from '#app/domain/shared/chain-context.js'
import type { OrderCore, OrderType, Signature } from '../order/types.js'
import { Side } from '../order/types.js'
import { Status } from '../shared/types.js'
import type { Address, Hash } from '../shared/types.js'

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
    signature: Signature
    fill: unknown
    signer: Address
  }
}
