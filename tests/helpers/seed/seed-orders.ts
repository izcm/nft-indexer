import { Hex } from 'viem'
import { addrOf, bytes32, bytes32n, priceWei } from '../hash.js'
import { Order, OrderCore, OrderRecord, OrderSignature } from '#app/domain/types/order.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import { orders } from '#app/db/collections.js'

const s = (x: number | bigint) => x.toString()

// super fake orders
export const seedOrders = async (
  chainId: number,
  collections: Hex[],
  countPerCollection: number,
  seed: string,
  now: number = 0
) => {
  // test data => safe to cast
  const byCollection: Record<Hex, Order[]> = {}

  for (const collection of collections) {
    byCollection[collection] = Array.from({ length: countPerCollection }).map((_, i) => {
      const orderSeed = `${seed}:${i}`
      const seedNum = Number(bytes32n(orderSeed))

      const startTs = now + i * 60 // orders are 1 minute apart
      const endTs = now + i * 60 + 3600 // valid for 1 hour

      const side = i % 2

      return {
        side: side,
        isCollectionBid: side === 1 && seedNum % 2 === 0,
        collection,
        tokenId: s(seedNum % 10000),
        currency: addrOf('currency'),
        price: s(priceWei(orderSeed)),
        actor: addrOf(orderSeed),
        start: s(startTs),
        end: s(endTs),
        nonce: s(seedNum),

        signature: dummySignature(orderSeed),
      }
    })
  }

  const allOrders = Object.values(byCollection).flat()

  const orderRecords: OrderRecord[] = allOrders.map(o => ({
    chainId,
    orderHash: hashOrderStruct(o),

    order: o,
    status: 'active',
    updatedAt: now,

    createdAt: now,
  }))

  return orders().insertMany(orderRecords)
}

const dummySignature = (seed: string): OrderSignature => {
  return {
    r: bytes32(`${seed}:r`),
    s: bytes32(`${seed}:s`),
    v: 27,
  }
}
