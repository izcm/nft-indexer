import type { Hex } from 'viem'

export type OrderType = 'ASK' | 'BID' | 'COLLECTION_BID'

export enum Side {
  ASK,
  BID,
}

export type SideLabel = keyof typeof Side

export type OrderStatus = 'active' | 'filled' | 'cancelled' | 'expired'

export type OrderRecord = {
  chainId: number
  orderHash: Hex

  order: Order
  fill?: {
    tokenId: string
    actor: Hex
  } // fill should only (!) exist for orders with status = filled

  status: OrderStatus
  updatedAt: number // only mutable field is status field

  createdAt: number

  // to not make changes to orderCore
  // the below fields are added for pagination ease
  // tokenIdSort: string = padStart(78, '0')
  // price: decimal128
}

export type Order = {
  side: number
  isCollectionBid: boolean
  collection: Hex
  tokenId: string
  currency: Hex
  price: string
  actor: Hex
  start: number
  end: number
  nonce: string

  signature: {
    r: Hex
    s: Hex
    v: number
  }
}

export type OrderCore = Omit<Order, 'signature'>
export type OrderSignature = Order['signature']
