import { Hex } from 'viem'

import { APP_NAME, APP_VERSION, CHAIN_ID, VERIFYING_CONTRACT } from '#app/domain/constants/app.js'
import { OrderCore } from '#app/domain/types/order.js'

export const dmrktDomain = {
  name: APP_NAME,
  version: APP_VERSION,
  chainId: CHAIN_ID,
  verifyingContract: VERIFYING_CONTRACT,
}
export const dmrktTypes = {
  Order: [
    { name: 'side', type: 'uint8' },
    { name: 'isCollectionBid', type: 'bool' },
    { name: 'collection', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'currency', type: 'address' },
    { name: 'price', type: 'uint256' },
    { name: 'actor', type: 'address' },
    { name: 'start', type: 'uint64' },
    { name: 'end', type: 'uint64' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const

export type OrderCore712 = {
  side: number
  isCollectionBid: boolean
  collection: Hex
  tokenId: bigint
  currency: Hex
  price: bigint
  actor: Hex
  start: bigint
  end: bigint
  nonce: bigint
}

export const toOrder712 = (order: OrderCore): OrderCore712 => ({
  side: order.side,
  isCollectionBid: order.isCollectionBid,
  collection: order.collection,
  tokenId: BigInt(order.tokenId),
  currency: order.currency,
  price: BigInt(order.price),
  actor: order.actor,
  start: BigInt(order.start),
  end: BigInt(order.end),
  nonce: BigInt(order.nonce),
})
