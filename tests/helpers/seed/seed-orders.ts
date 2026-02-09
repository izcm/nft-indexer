import { Hex } from 'viem'
import { addrOf, bytes32, bytes32n, priceWei } from '../hash.js'
import { Order, OrderCore, OrderRecord, OrderSignature } from '#app/domain/types/order.js'

const s = (x: number | bigint) => x.toString()

// super fake orders
export const seedOrders = async (
  chainId: number,
  collections: Hex[],
  countPerCollection: number,
  seed: string
) => {
  // test data => safe to cast
  const unixBase = 1_700_000_000
  const byCollection: Record<Hex, Order[]> = {}

  for (const collection of collections) {
    byCollection[collection] = Array.from({ length: countPerCollection }).map((_, i) => {
      const orderSeed = `seed:${i}`
      const seedNum = Number(bytes32n(orderSeed))

      const startTs = unixBase + i * 60 // orders are 1 minute apart
      const endTs = unixBase + i * 60 + 3600 // valid for 1 hour

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
}

const dummySignature = (seed: string): OrderSignature => {
  return {
    r: bytes32(`${seed}:r`),
    s: bytes32(`${seed}:s`),
    v: 27,
  }
}
