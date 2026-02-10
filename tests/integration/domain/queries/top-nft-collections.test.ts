import { afterAll, beforeAll, beforeEach, expect } from 'vitest'

import { nftCollections, orders } from '#app/db/collections.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { describe, it } from 'node:test'
import { seedCollections } from '#tests/helpers/seed/seed-nft-collections.js'
import { Side } from '#app/domain/order/types.js'

const CHAIN_ID = 1

beforeAll(async () => {
  startTestMongo()
})

afterAll(async () => {
  stopTestMongo()
})

beforeEach(() => {
  nftCollections().deleteMany({})
  orders().deleteMany({})
})

describe('topCollectionsByActiveOrders query', () => {
  it('groups + sorts + counts corectly', async () => {
    // --- seed collections ---

    seedCollections(CHAIN_ID, 3, 'sort')

    const collections = await nftCollections().find({}).toArray()

    // --- seed orders ---

    const askCount = 3
    const bidCount = 2
    const cbCount = 1

    const shapeFn = (i: number) => {
      if (i < askCount) {
        return { side: Side.ASK, isCollectionBid: false }
      }

      if (i < askCount + bidCount) {
        return { side: Side.BID, isCollectionBid: false }
      }

      return { side: Side.BID, isCollectionBid: true }
    }
  })

  it('respect limits', async () => {})

  it('order side is classified correctly', () => {})

  it('handles missing collections')
})
