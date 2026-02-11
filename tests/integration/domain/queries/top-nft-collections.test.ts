import { Hex } from 'viem'
import { afterAll, beforeAll, beforeEach, expect, describe, it } from 'vitest'

import { nftCollections, orders } from '#app/db/collections.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections } from '#tests/helpers/seed/seed-nft-collections.js'
import { Side } from '#app/domain/order/types.js'
import { seedOrders } from '#tests/helpers/seed/seed-orders.js'
import { addrOf } from '#tests/helpers/hash.js'
import {
  ActiveCounts,
  topNFTCollectionsByActiveOrders,
} from '#app/domain/queries/top-nft-collections.js'

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

    const colN = 3

    await seedCollections(CHAIN_ID, colN, 'seed')

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

    expect(queryResult).toHaveLength(colN)

    const sortedPlan = Object.entries(plan).sort(
      ([, a], [, b]) => b.ask + b.bid + b.cb - (a.ask + a.bid + a.cb)
    )

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

  it('respect limits', async () => {
    const colN = 10
    const limit = 3

    await seedCollections(CHAIN_ID, colN, 'seed')

    const cols = await nftCollections().find({}).toArray()

    await seedOrders(
      CHAIN_ID,
      cols.map(c => c.address),
      5,
      'seed'
    )

    const queryResult = await topNFTCollectionsByActiveOrders(CHAIN_ID, limit)

    expect(queryResult).toHaveLength(limit)
  })

  it('does not count inactive orders', async () => {
    const activeCount = 5
    const inactiveCount = 2

    await seedCollections(CHAIN_ID, 1, 'seed')

    const col = (await nftCollections().find({}).toArray())[0]

    await seedOrders(CHAIN_ID, [col.address], activeCount, 'active')
    await seedOrders(CHAIN_ID, [col.address], inactiveCount, 'inactive', 0, undefined, {
      status: 'cancelled',
    })

    const queryResult = await topNFTCollectionsByActiveOrders(CHAIN_ID, 100)

    expect(queryResult).toHaveLength(1)
    expect(queryResult[0].summary.totalActive).toBe(activeCount)
  })

  it('does not count orders with different chainId', async () => {
    const matchChainId = 1
    const matchingChainCount = 5

    const otherChainId = 1337
    const otherChainCount = 2

    await seedCollections(CHAIN_ID, 1, 'seed')

    const col = (await nftCollections().find({}).toArray())[0]

    await seedOrders(CHAIN_ID, [col.address], matchingChainCount, 'match')
    await seedOrders(otherChainId, [col.address], otherChainCount, 'other')

    const queryResult = await topNFTCollectionsByActiveOrders(matchChainId, 100)

    expect(queryResult).toHaveLength(1)
    expect(queryResult[0].summary.totalActive).toBe(matchingChainCount)
  })

  it('handles missing nft-collections while respecting limit', async () => {
    const colN = 3
    const perCol = 5

    const limit = 3

    await seedCollections(CHAIN_ID, colN, 'seed')
    const storedCols = await nftCollections().find({}).toArray()

    const missingColAddr = addrOf('missing')

    // seed stored collections with same order-count
    await seedOrders(
      CHAIN_ID,
      storedCols.map(c => c.address),
      perCol,
      'col_stored'
    )

    // seed orders for a collection address that is NOT present in nft-collections
    // -> has double order count to ensure its place in top 3
    // -> lookup will return empty → unwind drops it
    await seedOrders(CHAIN_ID, [missingColAddr], perCol * 2, 'col_missing')

    const queryResult = await topNFTCollectionsByActiveOrders(CHAIN_ID, limit)

    expect(queryResult).toHaveLength(limit)

    const addrs = queryResult.map(r => r.address)
    expect(addrs).not.toContain(missingColAddr)
  })
})
