import { Hex } from 'viem'

import { addrOf, bytes32, bytes32n, priceWei } from '../hash.js'
import { Order, OrderRecord, OrderSignature, Side } from '#app/domain/order/types.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import { orders } from '#app/db/collections.js'

const s = (x: number | bigint) => x.toString()

// super fake orders
export const seedOrders = async (
  chainId: number,
  collections: Hex[],
  countPerCollection: number,
  seed: string,
  now: number = 0,
  shapeFn?: (
    i: number
    // seedNum: number
  ) => {
    side: Side
    isCollectionBid: boolean
  },
  patch: Partial<OrderRecord> = {}
) => {
  const byCollection: Record<Hex, Order[]> = {}

  for (const collection of collections) {
    byCollection[collection] = Array.from({ length: countPerCollection }).map((_, i) =>
      buildFakeOrder(collection, i, seed, now, shapeFn)
    )
  }

  const allOrders = Object.values(byCollection).flat()

  const orderRecords: OrderRecord[] = allOrders.map(o => ({
    chainId,
    orderHash: hashOrderStruct(o),

    order: o,
    status: 'active',

    updatedAt: now,
    createdAt: now,

    ...patch,
  }))

  return orders().insertMany(orderRecords)
}

const buildFakeOrder = (
  collection: Hex,
  i: number,
  seed: string,
  now: number,
  shapeFn?: (i: number) => { side: Side; isCollectionBid: boolean }
): Order => {
  const orderSeed = `order:${i}:${seed}`
  const seedNum = Number(bytes32n(orderSeed))

  const startTs = now + i * 60
  const endTs = startTs + 3600

  const shape = shapeFn
    ? shapeFn(i)
    : {
        side: i % 2,
        isCollectionBid: i % 2 === 1 && seedNum % 2 === 0,
      }

  return {
    side: shape.side,
    isCollectionBid: shape.isCollectionBid,
    collection,
    tokenId: s(seedNum % 10000),
    currency: addrOf('currency'),
    price: s(priceWei(orderSeed)),
    actor: addrOf(orderSeed),
    start: s(startTs),
    end: s(endTs),
    nonce: s(bytes32n(orderSeed)), // don't use seedNum (bigint => number => bigint creates issues when hashing order)
    signature: dummySignature(orderSeed),
  }
}

const dummySignature = (seed: string): OrderSignature => {
  return {
    r: bytes32(`${seed}:r`),
    s: bytes32(`${seed}:s`),
    v: 27,
  }
}
