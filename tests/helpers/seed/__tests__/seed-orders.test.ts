import { afterAll, beforeAll, beforeEach, expect, describe, it } from 'vitest'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'

import { seedOrders } from '../seed-orders.js'
import { orders } from '#app/db/collections.js'
import { addrOf, bytes32n } from '#tests/helpers/hash.js'
import { Side } from '#app/domain/order/types.js'
import { Status } from '#app/domain/shared.js'

const CHAIN_ID = 1

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await orders().deleteMany({})
})

describe('seed-orders', () => {
  // --- helpers ---

  const makeParams = () => ({ colN: 2, perCol: 5 })

  const mockAddresses = (count: number) => {
    return Array.from({ length: count }).map((_, i) => addrOf(`collection:${i}`))
  }

  it('inserts collections * countPerCollection', async () => {
    const { colN, perCol } = makeParams()

    const cols = mockAddresses(colN)

    await seedOrders(CHAIN_ID, cols, perCol, 'seed')

    const orderRows = await orders().find({}).toArray()

    expect(orderRows.length).toBe(colN * perCol)

    for (const col of cols) {
      const n = orderRows.filter(o => o.order.collection === col).length

      expect(n).toBe(perCol)
    }
  })

  it('uses shapeFn for side + collectionBid', async () => {
    const colN = 1
    const perCol = 5

    // array of one address
    const cols = mockAddresses(colN)

    const shapeFn = () => ({ side: Side.ASK, isCollectionBid: true })

    await seedOrders(CHAIN_ID, cols, perCol, 'shapeFn', 0, shapeFn)

    const orderDocs = await orders().find({}).toArray()

    expect(orderDocs.every(o => o.order.side === Side.ASK && o.order.isCollectionBid)).toBe(true)
  })

  it('defaults to active status', async () => {
    const { colN, perCol } = makeParams()

    const cols = mockAddresses(colN)

    await seedOrders(CHAIN_ID, cols, perCol, 'seed')

    const orderDocs = await orders().find({}).toArray()

    expect(orderDocs.length).toBe(colN * perCol)
    expect(orderDocs.every(o => o.status === 'active')).toBe(true)
  })

  it('falls back to default side logic', async () => {
    const colN = 1
    const perCol = 3

    // array of one address
    const cols = mockAddresses(colN)

    const seed = 'seed'
    const seedNums = Array.from({ length: perCol }).map((_, i) => Number(bytes32n(`seed:${i}`)))

    await seedOrders(CHAIN_ID, cols, perCol, seed)

    const orderDocs = await orders().find({}).sort({ createdAt: 1 }).toArray()

    expect(orderDocs.length).toBe(perCol)

    for (let i = 0; i < perCol; i++) {
      const expected = {
        side: i % 2 === 0 ? Side.ASK : Side.BID,
        isCollectionBid: i % 2 === 1 && seedNums[i] % 2 === 0,
      }

      expect(orderDocs[i]).toMatchObject({
        order: expected,
      })
    }
  })

  it('sets expected fields when patch is passed', async () => {
    const cols = mockAddresses(1)

    await seedOrders(CHAIN_ID, cols, 1, 'seed', 0, undefined, { status: 'cancelled' })

    const orderDocs = await orders().find({}).toArray()
    expect(orderDocs.length).toBe(1)

    const doc = orderDocs[0]

    expect(doc.status).toBe('cancelled')
  })
})
