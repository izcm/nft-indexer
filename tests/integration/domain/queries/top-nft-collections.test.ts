import { nftCollections, orders } from '#app/db/collections.js'
import { Side } from '#app/domain/order/types.js'
import {
  ActiveCounts,
  topNFTCollectionsByActiveOrders,
} from '#app/views/nft-collections/top-nft-collections.js'
import { addrOf } from '#tests/helpers/evm-fixtures.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections as _seedCollections } from '#tests/helpers/seed/seed-nft-collections.js'
import { seedOrders as _seedOrders } from '#tests/helpers/seed/seed-orders.js'
import { Hex } from 'viem'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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
  const CHAIN_ID = 1

  type Counts = {
    ask: number
    bid: number
    cb: number
  }

  const seedCollections = (count: number, seed: string) => {
    return _seedCollections(CHAIN_ID, count, seed)
  }

  const seedOrders = (
    collections: Hex[],
    perCollection: number,
    seed: string,
    now?: number,
    shapeFn?: Parameters<typeof _seedOrders>[5],
    patch?: Parameters<typeof _seedOrders>[6]
  ) => {
    return _seedOrders(CHAIN_ID, collections, perCollection, seed, now ?? 0, shapeFn, patch)
  }

  const makeShapeFn = (ask: number, bid: number, cb: number) => (i: number) => {
    if (i < ask) return { side: Side.ASK, isCollectionBid: false }

    if (i < bid + ask) return { side: Side.BID, isCollectionBid: false }

    return { side: Side.BID, isCollectionBid: true }
  }

  it('groups + sorts + counts corectly', async () => {
    // --- seed collections ---

    const colN = 3

    await seedCollections(colN, 'seed')

    const cols = await nftCollections().find({}).toArray()

    // --- seed orders ---

    const plan: Record<Hex, Counts> = {
      [cols[0].address]: { ask: 1, bid: 2, cb: 3 },
      [cols[1].address]: { ask: 1, bid: 1, cb: 0 },
      [cols[2].address]: { ask: 0, bid: 2, cb: 2 },
    }

    for (const [addr, c] of Object.entries(plan)) {
      await seedOrders(
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

    await seedCollections(colN, 'seed')

    const cols = await nftCollections().find({}).toArray()

    await seedOrders(
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

    await seedCollections(1, 'seed')

    const col = (await nftCollections().find({}).toArray())[0]

    await seedOrders([col.address], activeCount, 'active')
    await seedOrders([col.address], inactiveCount, 'inactive', 0, undefined, {
      status: 'cancelled',
    })

    const queryResult = await topNFTCollectionsByActiveOrders(CHAIN_ID, 100)

    expect(queryResult).toHaveLength(1)
    expect(queryResult[0].summary.totalActive).toBe(activeCount)
  })

  it('only counts orders for target chainId', async () => {
    const target = {
      chainId: 1,
      count: 5,
    }

    const other = {
      chainId: 31337,
      count: 2,
    }

    await seedCollections(1, 'seed')

    const col = (await nftCollections().find({}).toArray())[0]

    await _seedOrders(target.chainId, [col.address], target.count, 'match')
    await _seedOrders(other.chainId, [col.address], other.count, 'other') //

    const queryResult = await topNFTCollectionsByActiveOrders(target.chainId, 100)

    expect(queryResult).toHaveLength(1)
    expect(queryResult[0].summary.totalActive).toBe(target.count)
  })

  it('handles missing nft-collection while respecting limit', async () => {
    const colN = 3
    const perCol = 5

    const limit = 3

    await seedCollections(colN, 'seed')
    const storedCols = await nftCollections().find({}).toArray()

    const missingColAddr = addrOf('missing')

    // seed stored collections with same order-count
    await seedOrders(
      storedCols.map(c => c.address),
      perCol,
      'col_stored'
    )

    // seed orders for a collection address that is NOT present in nft-collections
    // -> has double order count to ensure its place in top 3
    // -> lookup will return empty → unwind drops it
    await seedOrders([missingColAddr], perCol * 2, 'col_missing')

    const queryResult = await topNFTCollectionsByActiveOrders(CHAIN_ID, limit)

    expect(queryResult).toHaveLength(limit)

    const addrs = queryResult.map(r => r.address)
    expect(addrs).not.toContain(missingColAddr)
  })
})
