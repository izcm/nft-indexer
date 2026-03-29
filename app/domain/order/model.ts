import type { Address, ChainEvent, Hash } from '../shared/types/eth.js'
import type { WithTimestamps } from '../shared/types/with-timestamps.js'

export type OrderKey = {
  chainId: number
  orderHash: Hash
}

export const orderKeyOf = (record: OrderRecord): OrderKey => ({
  chainId: record.chainId,
  orderHash: record.orderHash,
})

export type OrderType = 'ASK' | 'BID' | 'COLLECTION_BID'

export enum OrderSide {
  ASK,
  BID,
}

export type SideLabel = keyof typeof OrderSide

export type OrderStatus = 'active' | 'filled' | 'cancelled' | 'expired'

export type OrderRecord = OrderKey &
  WithTimestamps & {
    order: Order
    status: OrderStatus

    // 'OrderCancelled' chain event
    cancellation?: ChainEvent
  }

// todo: remove this and store raw
export type Signature = {
  r: Hash
  s: Hash
  v: number
}

export type Order = {
  side: number
  isCollectionBid: boolean
  collection: Address
  tokenId: string
  currency: Address
  price: string
  actor: Address
  // uint64 cannot safely cast to number
  start: string
  end: string
  nonce: string

  signature: Signature
  // signature: Hash // 0x{r]{s}{v} todo: do this instead
}

export type OrderCore = Omit<Order, 'signature'>

// --- query layer ---

export type OrderQueryModel = OrderCore & { status: OrderStatus }

export const ORDER_SORT_FIELDS = ['createdAt', 'updatedAt'] as const
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number]
