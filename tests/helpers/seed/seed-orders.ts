import { orders } from '#app/db/collections.js'
import type { Order, OrderRecord, Signature } from '#app/domain/order/model.js'
import { OrderSide } from '#app/domain/order/model.js'
import type { Address, Hash } from '#app/domain/shared/types/eth.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import { addrOf, bytes32, bytes32n, priceWei } from '#tests/helpers/evm-fixtures.js'
import { ObjectId } from 'mongodb'

const s = (x: number | bigint) => x.toString()

// super fake orders
export async function seedOrders(
  chainId: number,
  collections: Address[],
  countPerCollection: number,
  seed: string,
  now: number = 0,
  shapeFn?: (
    i: number
    // seedNum: number
  ) => {
    side: OrderSide
    isCollectionBid: boolean
  },
  overrides: Partial<Omit<OrderRecord, 'order' | 'orderHash'>> = {}
) {
  const byCollection: Record<Address, Order[]> = {}

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

    ...overrides,
  }))

  return orders().insertMany(orderRecords as any)
}

function buildFakeOrder(
  collection: Address,
  i: number,
  seed: string,
  now: number,
  shapeFn?: (i: number) => { side: OrderSide; isCollectionBid: boolean }
): Order {
  const orderSeed = `${i}:${seed}`
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
    price: s(priceWei(`price:${orderSeed}`)),
    actor: addrOf(orderSeed),
    start: s(startTs),
    end: s(endTs),
    nonce: s(bytes32n(orderSeed)), // don't use seedNum (bigint => number => bigint creates issues when hashing order)
    signature: dummySignature(orderSeed),
  }
}

const dummySignature = (seed: string): Signature => {
  return {
    r: bytes32(`${seed}:r`) as Hash,
    s: bytes32(`${seed}:s`) as Hash,
    v: 27,
  }
}
