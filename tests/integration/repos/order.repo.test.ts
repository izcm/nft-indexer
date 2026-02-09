import { vi, afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { Hex } from 'viem'

import { orders } from '#app/db/collections.js'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { mockOrderCore } from '#tests/mocks/primitives.js'
import { OrderRecord } from '#app/domain/types/order.js'
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

  describe('write', () => {
    const startTime = 0
    const writeTime = 1000

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
      const { save } = orderRepo

      it('inserts order doc for new chainId + orderHash pair', async () => {
        const { chainId, order } = baseDoc
        await save(chainId, order)

        const rows = await orders().find({}).toArray()

        expect(rows.length).toBe(1)
        const inserted = rows[0]

        expect(inserted).toMatchObject(baseDoc)
        expect(inserted._id).toBeInstanceOf(ObjectId)
      })

      it('throws error for duplicate chainId + orderHash pair', async () => {
        const { chainId, order } = baseDoc

        // unique pair
        await save(chainId, order)

        // duplicate pair
        await expect(save(chainId, order)).rejects.toThrow()

        const rows = await orders().find({}).toArray()
        expect(rows.length).toBe(1)
      })
    })
  })
})
