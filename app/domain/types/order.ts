import type { Hex } from 'viem'

export type OrderType = 'ASK' | 'BID' | 'COLLECTION_BID'

export const toOrderType = (side: number, isCollectionBid: boolean): OrderType => {
  const direction = Side[side] as SideLabel
  return direction === 'BID' && isCollectionBid ? 'COLLECTION_BID' : direction
}

export enum Side {
  ASK,
  BID,
}

export type SideLabel = keyof typeof Side

export type OrderStatus = 'active' | 'filled' | 'cancelled' | 'expired'

export type OrderRecord = {
  orderHash: Hex
  chainId: number

  order: Order

  status: OrderStatus
  updatedAt: number // only mutable field is status field

  createdAt: number
}

export type Order = {
  side: number
  isCollectionBid: boolean
  collection: Hex
  tokenId: string
  currency: Hex
  price: string
  actor: Hex
  // end & start = user input => don't cast to number
  start: string
  end: string
  nonce: string

  signature: {
    r: Hex
    s: Hex
    v: number
  }
}

export type OrderCore = Omit<Order, 'signature'>
export type OrderSignature = Order['signature']
