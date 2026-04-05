import { OrderSide } from '#app/domain/order/model.js'
import { addrOf, bytes32n } from '#tests/helpers/evm-fixtures.js'
import { describe, expect, it } from 'vitest'
import { buildFakeOrders } from '../build-orders.js'

describe('buildFakeOrders', () => {
  const CHAIN_ID = 1

  const makeParams = () => ({ colN: 2, perCol: 5 })

  const mockAddresses = (count: number) =>
    Array.from({ length: count }).map((_, i) => addrOf(`collection:${i}`))

  it('returns collections * countPerCollection records', async () => {
    const { colN, perCol } = makeParams()
    const cols = mockAddresses(colN)

    const docs = await buildFakeOrders(CHAIN_ID, cols, perCol, 'seed')

    expect(docs.length).toBe(colN * perCol)

    for (const col of cols) {
      const n = docs.filter(o => o.order.collection === col).length
      expect(n).toBe(perCol)
    }
  })

  it('uses shapeFn for side + collectionBid', async () => {
    const { colN, perCol } = makeParams()
    const cols = mockAddresses(colN)
    const shapeFn = () => ({ side: OrderSide.ASK, isCollectionBid: true })

    const docs = await buildFakeOrders(CHAIN_ID, cols, perCol, 'shapeFn', 0, shapeFn)

    expect(docs.length).toBe(colN * perCol)
    expect(docs.every(o => o.order.side === OrderSide.ASK && o.order.isCollectionBid)).toBe(true)
  })

  it('falls back to default side logic', async () => {
    const colN = 1
    const perCol = 3
    const cols = mockAddresses(colN)
    const seed = 'seed'
    const seedNums = Array.from({ length: perCol }).map((_, i) => Number(bytes32n(`${i}:${seed}`)))

    const docs = await buildFakeOrders(CHAIN_ID, cols, perCol, seed)

    expect(docs.length).toBe(perCol)

    for (let i = 0; i < perCol; i++) {
      expect(docs[i]).toMatchObject({
        order: {
          side: i % 2 === 0 ? OrderSide.ASK : OrderSide.BID,
          isCollectionBid: i % 2 === 1 && seedNums[i] % 2 === 0,
        },
      })
    }
  })

  it('applies default record fields to all orders', async () => {
    const { colN, perCol } = makeParams()
    const cols = mockAddresses(colN)

    const docs = await buildFakeOrders(CHAIN_ID, cols, perCol, 'seed')

    expect(docs).toHaveLength(colN * perCol)

    for (const doc of docs) {
      expect(doc).toMatchObject({ status: 'active', updatedAt: 0, createdAt: 0 })
    }
  })

  it('applies root-level overrides', async () => {
    const cols = mockAddresses(1)

    const docs = await buildFakeOrders(CHAIN_ID, cols, 1, 'seed', 0, undefined, {
      status: 'cancelled',
    })

    expect(docs).toHaveLength(1)
    expect(docs[0].status).toBe('cancelled')
  })
})
