import { afterAll, beforeAll, beforeEach, expect, describe, it } from 'vitest'

import { nftCollections, orders } from '#app/db/collections.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections } from '#tests/helpers/seed/seed-nft-collections.js'
import { Side } from '#app/domain/order/types.js'
import { Hex } from 'viem'
import { seedOrders } from '#tests/helpers/seed/seed-orders.js'
import {
  ActiveCounts,
  TopNFTCollectionByActiveOrders,
  topNFTCollectionsByActiveOrders,
} from '#app/domain/queries/top-nft-collections.js'
import { a, b } from 'node_modules/vitest/dist/chunks/suite.d.BJWk38HB.js'

const CHAIN_ID = 1

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await nftCollections().deleteMany({})
  await orders().deleteMany({})
})

describe('topCollectionsByActiveOrders query', () => {
  type Counts = {
    ask: number
    bid: number
    cb: number
  }

  const makeShapeFn = (ask: number, bid: number, cb: number) => (i: number) => {
    if (i < ask) return { side: Side.ASK, isCollectionBid: false }

    if (i < bid + ask) return { side: Side.BID, isCollectionBid: false }

    return { side: Side.BID, isCollectionBid: true }
  }

  it('groups + sorts + counts corectly', async () => {
    // --- seed collections ---

    seedCollections(CHAIN_ID, 3, 'sort')

    const cols = await nftCollections().find({}).toArray()

    // --- seed orders ---

    const plan: Record<Hex, Counts> = {
      [cols[0].address]: { ask: 1, bid: 2, cb: 3 },
      [cols[1].address]: { ask: 1, bid: 1, cb: 0 },
      [cols[2].address]: { ask: 0, bid: 2, cb: 2 },
    }

    for (const [addr, c] of Object.entries(plan)) {
      seedOrders(
        CHAIN_ID,
        [addr as Hex],
        c.ask + c.bid + c.cb,
        addr,
        0,
        makeShapeFn(c.ask, c.bid, c.cb)
      )
    }

    // --- run query ---

    const queryResult = await topNFTCollectionsByActiveOrders(CHAIN_ID, 100)

    // --- test expectations ---

    expect(queryResult.length).toBe(3)

    const sortedPlan = Object.entries(plan).sort(
      ([, a], [, b]) => b.ask + b.bid + b.cb - (a.ask + a.bid + a.cb)
    )

    const wtf = sortedPlan.entries()
    const wtf2 = Object.fromEntries(sortedPlan)

    for (const [i, [addr, c]] of sortedPlan.entries()) {
      expect(queryResult[i]).toMatchObject({
        address: addr,
        summary: {
          activeAskCount: c.ask,
          activeBidCount: c.bid,
          activeCbCount: c.cb,
          totalActive: c.ask + c.bid + c.cb,
        } satisfies ActiveCounts,
      })
    }
  })

  it('respect limits', async () => {})

  it('does not count inactive orders', async () => {})

  it('does not count orders with different chainId', async () => {})

  it('order side is classified correctly', () => {})

  it('handles missing collections', async () => {})
})
