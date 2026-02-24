import type { Address, Hash } from '../shared/eth.js'

export type OrderType = 'ASK' | 'BID' | 'COLLECTION_BID'

export enum Side {
  ASK,
  BID,
}

export type SideLabel = keyof typeof Side

export type OrderStatus = 'active' | 'filled' | 'cancelled' | 'expired'

export type OrderRecord = {
  chainId: number
  orderHash: Hash

  order: Order

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
  collection: Address
  tokenId: string
  currency: Address
  price: string
  actor: Address
  start: number
  end: number
  nonce: string

  signature: {
    r: Hash
    s: Hash
    v: number
  }
}

export type OrderCore = Omit<Order, 'signature'>
export type OrderSignature = Order['signature']
