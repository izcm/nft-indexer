import type { Hex } from 'viem'

import { BlockTime, TxContext } from '#app/listeners/types/context.js'
import { OrderType, Side, SideLabel } from '../order/types.js'
import { Status } from '../enum.js'

export type Settlement = {
  chainId: number
  orderHash: Hex

  collection: Hex
  tokenId: string

  seller: Hex
  buyer: Hex

  currency: Hex
  price: string

  orderAttributes?: SettlementMeta['order']

  execution: {
    logIndex: number
    txHash: Hex
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

    signer: Hex
  }
  txContext: TxContext
}
