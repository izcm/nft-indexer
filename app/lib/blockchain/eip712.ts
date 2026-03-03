import { APP_CHAINS, APP_NAME, APP_VERSION, VERIFYING_CONTRACT } from '#app/domain/constants/app.js'
import { OrderCore } from '#app/domain/order/model.js'
import { encodeAbiParameters, Hex, keccak256, toBytes } from 'viem'

// ! NB:
// this should be in some shared package a2z/packages

export const dmrktDomain = {
  name: APP_NAME,
  version: APP_VERSION,
  chainId: APP_CHAINS[0], // per now only one chain
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

export const hashOrderStruct = (o: OrderCore): Hex => {
  const encoded = encodeAbiParameters(
    [
      { type: 'bytes32' },
      { type: 'uint8' },
      { type: 'bool' },
      { type: 'address' },
      { type: 'uint256' },
      { type: 'address' },
      { type: 'uint256' },
      { type: 'address' },
      { type: 'uint64' },
      { type: 'uint64' },
      { type: 'uint256' },
    ],
    [
      ORDER_TYPE_HASH(),
      o.side,
      o.isCollectionBid,
      o.collection,
      BigInt(o.tokenId),
      o.currency,
      BigInt(o.price),
      o.actor,
      BigInt(o.start),
      BigInt(o.end),
      BigInt(o.nonce),
    ]
  )

  return keccak256(encoded)
}

const ORDER_TYPE_HASH = () =>
  keccak256(
    toBytes(
      'Order(uint8 side,bool isCollectionBid,address collection,uint256 tokenId,address currency,uint256 price,address actor,uint64 start,uint64 end,uint256 nonce)'
    )
  )
