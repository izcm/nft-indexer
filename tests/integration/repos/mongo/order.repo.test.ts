import { Decimal128, ObjectId } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { orders } from '#app/db/collections.js'
import { OrderRecord } from '#app/domain/order/model.js'
import { orderRepo } from '#app/repos/mongo/order.repo.js'

// test helpers
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo/mongo-memory.js'
import { fakeOrderRecord } from '#tests/helpers/fixtures.js'
import { addrOf } from '#tests/helpers/evm-fixtures.js'
import { OrderDoc } from '#app/repos/mongo/model/docs.js'
import { fakeOrderDoc } from '#tests/helpers/mongo/to-doc.js'
import { seedOrders } from '#tests/helpers/mongo/seed-mongo.js'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await orders().deleteMany()
})

describe('orderRepo', () => {
  const repo = orderRepo

  // === defaults ===

  async function givenOrderDocExists(overrides: Partial<OrderRecord> = {}) {
    const orderDoc = fakeOrderDoc()

    const { insertedId } = await orders().insertOne({
      ...orderDoc,
      _id: new ObjectId(),
    })

    return { insertedId, orderDoc }
  }

  /* ======================================
    repo read
  ====================================== */

  describe('findByOrderKey', () => {
    it('findByOrderKey returns expected doc for chainId + orderHash', async () => {
      const { orderDoc } = await givenOrderDocExists()
      const { chainId, orderHash } = orderDoc

      const row = await repo.findByKey({ chainId, orderHash })
      if (!row) throw new Error('row missing')

      expect(row).toMatchObject(orderDoc)
    })

    it('findByOrderKey returns null when not found', async () => {
      const row = await repo.findByKey({
        chainId: 1,
        orderHash: '0x1234' as any,
      })

      expect(row).toBeNull()
    })
  })

  // findPageGeneric is extensively tested with both unit + seperate integration tests
  describe('findPage', async () => {
    it('filters settlement createdAt range', async () => {
      const col = addrOf('col')

      // seed three orders with different createdAt values
      await seedOrders(1, [col], 1, 'a', 100)
      await seedOrders(1, [col], 1, 'b', 200)
      await seedOrders(1, [col], 1, 'c', 300)

      // only from + to are relevant to this test
      const res = await repo.findPage({
        from: 150,
        to: 250,
        cursor: undefined,
        sortDir: 'asc',
        sortField: 'createdAt',
        rangeField: 'createdAt',
        limit: 100,
      })

      expect(res.items).toHaveLength(1)
      expect(res.items[0].createdAt).toBe(200)
    })
  })

  /* ======================================
    repo write
  ====================================== */

  describe('write', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })

    beforeEach(() => {
      vi.setSystemTime(0)
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    it('rejects manual duplicate insertion', async () => {
      const { orderDoc } = await givenOrderDocExists()

      await expect(orders().insertOne(fakeOrderDoc())).rejects.toThrow()
    })

    describe('ensure', () => {
      it('inserts order doc for new chainId + orderHash pair', async () => {
        const orderDoc = fakeOrderRecord()

        const { chainId, order } = orderDoc
        const result = await repo.ensure(chainId, order)

        // expectations on repo return values
        expect(result.chainId).toBeDefined()
        expect(result.orderHash).toBeDefined()

        expect(result.didUpsert).toBe(true)

        // expectations on inserted row
        const rows = await orders().find().toArray()
        expect(rows.length).toBe(1)

        const inserted = rows[0]
        expect(inserted).toMatchObject(orderDoc)

        // compare return values to inserted
        expect(result.chainId).toEqual(inserted.chainId)
        expect(result.orderHash).toEqual(inserted.orderHash)
      })
    })

    it('does not overwrite an existing order', async () => {
      const { orderDoc } = await givenOrderDocExists()

      const original = await orders().findOne({
        chainId: orderDoc.chainId,
        orderHash: orderDoc.orderHash,
      })
      if (!original) throw Error('missing')

      // try ensure again
      const { chainId, order } = orderDoc
      await repo.ensure(chainId, order)

      const after = await orders().findOne({
        chainId: orderDoc.chainId,
        orderHash: orderDoc.orderHash,
      })
      if (!after) throw Error('missing')

      expect(after).toEqual(original)
    })
  })

  describe('updateStatus', () => {
    it('sets status and date', async () => {
      const startTime = 0

      const { chainId, orderHash } = (
        await givenOrderDocExists({ status: 'active', updatedAt: startTime })
      ).orderDoc

      const rowBefore = await orders().findOne({ chainId, orderHash })
      if (!rowBefore) throw Error('row missing')

      // sanity checks
      expect(rowBefore.updatedAt).toBe(startTime)
      expect(rowBefore.status).toBe('active')

      vi.setSystemTime(startTime + 1)

      await repo.updateStatus({ chainId, orderHash, status: 'filled' })

      const rowAfter = await orders().findOne({ chainId, orderHash })
      if (!rowAfter) throw Error('row missing')

      // should be identical to rowBefore except status + updatedAt
      expect(rowAfter).toMatchObject({ ...rowBefore, status: 'filled', updatedAt: startTime + 1 })
    })

    it('does not upsert if order does not exist', async () => {
      const { chainId, orderHash } = fakeOrderRecord()

      await repo.updateStatus({ chainId, orderHash, status: 'filled' })

      const rows = await orders().find().toArray()

      expect(rows).toHaveLength(0)
    })
  })
})
