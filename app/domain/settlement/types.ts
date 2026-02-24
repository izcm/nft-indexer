import type { BlockTime, TxContext } from '#app/listeners/types/context.js'
import type { OrderType } from '../order/types.js'
import { Side } from '../order/types.js'
import { Status } from '../shared/enum.js'
import type { Address, Hash } from '../shared/eth.js'

// todo: on settlement ingest, parse the order and fill
// - if order doesnt exist in db => create new with status = "filled"
// - for both existing and new order, attach the fill

export type Settlement = {
  chainId: number
  orderHash: Hash

  collection: Address
  tokenId: string

  seller: Address
  buyer: Address

  currency: Address
  price: string

  orderAttributes?: SettlementMeta['order']

  execution: {
    logIndex: number
    txHash: Hash
    block: BlockTime
    txContext?: SettlementMeta['txContext']
  }

  metaStatus: Status
  metaError?: string

  ingestedAt: number
}

// atomic metadata eg. fetched in one request ( no partial data )

export type SettlementMeta = {
  order: {
    type: OrderType

    // added to make queries easier
    side: Side
    isCollectionBid: boolean

    signer: Address
  }
  txContext: TxContext
}
