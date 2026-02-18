import { vi, afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { ObjectId } from 'mongodb'

import { orders } from '#app/db/collections.js'
import { orderRepo } from '#app/repos/order.repo.js'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { mockOrderCore, mockOrderRecord } from '#tests/mocks/primitives.js'
import { OrderRecord } from '#app/domain/order/types.js'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await orders().deleteMany({})
})

describe('orderRepo', () => {
  const repo = orderRepo

  // === defaults ===

  const core = mockOrderCore()

  async function givenOrderRecordExists(overrides: Partial<OrderRecord> = {}) {
    const orderRecord = mockOrderRecord(overrides)
    const { insertedId } = await orders().insertOne(orderRecord)

    return { insertedId, orderRecord }
  }

  /* ======================================
    repo read
  ====================================== */

  describe('findById', () => {
    it('returns expected doc', async () => {
      const { insertedId, orderRecord } = await givenOrderRecordExists()

      const row = await repo.findById(insertedId)
      if (!row) throw new Error('row missing')

      expect(row._id).toBeInstanceOf(ObjectId)
      expect(row).toMatchObject(orderRecord)
    })

    it('returns null when id does not exist', async () => {
      const id = new ObjectId()

      const row = await repo.findById(id)

      expect(row).toBeNull()
    })
  })

  describe('findByOrderKey', () => {
    it('findByOrderKey returns expected doc for chainId + orderHash', async () => {
      const { orderRecord } = await givenOrderRecordExists()
      const { chainId, orderHash } = orderRecord

      const row = await repo.findByOrderKey({ chainId, orderHash })
      if (!row) throw new Error('row missing')

      expect(row).toMatchObject(orderRecord)
    })

    it('findByOrderKey returns null when not found', async () => {
      const row = await repo.findByOrderKey({
        chainId: 1,
        orderHash: '0x1234' as any,
      })

      expect(row).toBeNull()
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
      const { orderRecord } = await givenOrderRecordExists()

      await expect(orders().insertOne(orderRecord)).rejects.toThrow()
    })

    describe('ensure', () => {
      it('inserts order doc for new chainId + orderHash pair', async () => {
        const { orderRecord } = await givenOrderRecordExists()

        const { chainId, order } = orderRecord
        const { id, didUpsert } = await repo.ensure(chainId, order)

        // expectations on repo return values
        expect(id).toBeDefined()
        expect(id).toBeInstanceOf(ObjectId)
        expect(didUpsert).toBe(true)

        // expectations on inserted row
        const rows = await orders().find().toArray()
        expect(rows.length).toBe(1)

        const inserted = rows[0]
        expect(inserted).toMatchObject(orderRecord)

        // compare return values to inserted
        expect(inserted._id.equals(id)).toBe(true)
      })

      it('handles duplicate chainId + orderHash pair and informs of no upsert', async () => {
        const startTime = 0

        const { chainId, order } = (await givenOrderRecordExists({ createdAt: startTime }))
          .orderRecord

        const first = await repo.ensure(chainId, order)

        expect(first.didUpsert).toBe(true)
        expect(first.id).toBeDefined()

        vi.setSystemTime(startTime + 1)

        const second = await repo.ensure(chainId, order)

        expect(second.id).toBeDefined()
        expect(second.didUpsert).toBe(false)

        expect(second.id).toEqual(first.id)

        const rows = await orders().find().toArray()
        expect(rows.length).toBe(1)
      })
    })

    it('does not overwrite an existing order', async () => {
      const { orderRecord } = await givenOrderRecordExists()

      const original = await orders().findOne({
        chainId: orderRecord.chainId,
        orderHash: orderRecord.orderHash,
      })
      if (!original) throw Error('missing')

      // try ensure again
      const { chainId, order } = orderRecord
      await repo.ensure(chainId, order)

      const after = await orders().findOne({
        chainId: orderRecord.chainId,
        orderHash: orderRecord.orderHash,
      })
      if (!after) throw Error('missing')

      expect(after).toEqual(original)
    })
  })

  describe('updateStatus', () => {
    it('sets status and date', async () => {
      const startTime = 0

      const { chainId, orderHash } = (
        await givenOrderRecordExists({ status: 'active', updatedAt: startTime })
      ).orderRecord

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

    it('does nothing if order not found', async () => {
      const { chainId, orderHash } = mockOrderRecord()

      const result = await repo.updateStatus({ chainId, orderHash, status: 'filled' })

      expect(result.acknowledged).toBe(true)

      // no match or modifications
      expect(result.matchedCount).toBe(0)
      expect(result.modifiedCount).toBe(0)

      // upsert should be off
      expect(result.upsertedCount).toBe(0)
    })
  })
})
