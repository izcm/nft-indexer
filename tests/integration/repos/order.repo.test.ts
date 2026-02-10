import { vi, afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { Hex } from 'viem'

import { orders } from '#app/db/collections.js'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { mockOrderCore } from '#tests/mocks/primitives.js'
import { OrderRecord } from '#app/domain/order/types.js'
import { orderRepo } from '#app/repos/order.repo.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import { ObjectId } from 'mongodb'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await orders().deleteMany({})
})

const TEST_CHAIN_ID = 1

describe('orderRepo', () => {
  const repo = orderRepo

  // === defaults ===

  const chainId = TEST_CHAIN_ID
  const core = mockOrderCore()

  const baseDoc: OrderRecord = {
    chainId,
    orderHash: hashOrderStruct(core),
    order: {
      ...core,
      signature: {
        r: '0xabc' as Hex,
        s: '0xabc' as Hex,
        v: 27,
      },
    },
    status: 'active',
    updatedAt: 0,
    createdAt: 0,
  }

  // === test repo write ===

  describe('write', () => {
    const startTime = 0

    beforeAll(() => {
      vi.useFakeTimers()
    })

    beforeEach(() => {
      vi.setSystemTime(startTime)
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    describe('save', () => {
      it('inserts order doc for new chainId + orderHash pair', async () => {
        const { chainId, order } = baseDoc
        await repo.save(chainId, order)

        const rows = await orders().find({}).toArray()

        expect(rows.length).toBe(1)
        const inserted = rows[0]

        expect(inserted).toMatchObject(baseDoc)
        expect(inserted._id).toBeInstanceOf(ObjectId)
      })

      it('throws error for duplicate chainId + orderHash pair', async () => {
        const { chainId, order } = baseDoc

        const { save } = orderRepo

        await save(chainId, order)
        await expect(save(chainId, order)).rejects.toThrow()

        const rows = await orders().find({}).toArray()
        expect(rows.length).toBe(1)
      })
    })
  })

  describe('updateStatus', () => {
    const writeTime = 1000

    it('sets status and date', async () => {
      await orders().insertOne(baseDoc)

      vi.setSystemTime(writeTime)

      const { chainId, orderHash } = baseDoc
      await repo.updateStatus(chainId, orderHash, 'filled')

      const row = await orders().findOne({ chainId, orderHash })
      if (!row) throw Error('row missing')

      expect(row.status).toBe('filled')
      expect(row.updatedAt).toBe(writeTime)
    })

    it('does nothing if order not found', async () => {
      const { chainId, orderHash } = baseDoc
      const result = await repo.updateStatus(chainId, orderHash, 'filled')

      expect(result.acknowledged).toBe(true)

      // no match or modifications
      expect(result.matchedCount).toBe(0)
      expect(result.modifiedCount).toBe(0)

      // upsert should be disabled
      expect(result.upsertedCount).toBe(0)
    })
  })

  // === test repo read ===

  describe('read', async () => {
    it('findById returns expected doc', async () => {
      const { insertedId } = await orders().insertOne(baseDoc)

      const row = await repo.findById(insertedId)
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row._id).toBeInstanceOf(ObjectId)
      expect(row).toMatchObject(baseDoc)
    })

    it('findByChainIdAndOrderHash returns expected doc', async () => {
      await orders().insertOne(baseDoc)

      const { chainId, orderHash } = baseDoc
      const row = await repo.findByChainIdAndOrderHash(chainId, orderHash)
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row).toMatchObject(baseDoc)
    })
  })
})
