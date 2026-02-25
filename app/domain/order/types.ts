import type { Address, Hash } from '../shared/types.js'

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

  //   filledTxHash = txHash
  // filledBlock = blockNumber
  // filledLogIndex = logIndex

  updatedAt: number

  createdAt: number
}

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
  start: number
  end: number
  nonce: string

  signature: Signature
}

export type OrderCore = Omit<Order, 'signature'>
