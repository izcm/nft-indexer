import { vi, afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { Hex } from 'viem'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { settlements } from '#app/db/collections.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { seedSettlements } from '#tests/helpers/seed/seed-settlements.js'
import { Settlement } from '#app/domain/settlement/types.js'
import { mockSettlement, mockSettlementMeta } from '#tests/mocks/primitives.js'
import { ObjectId } from 'mongodb'
import { bytes32 } from '#app/lib/utils/evm-primitives.js'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await settlements().deleteMany({})
})

describe('settlementRepo', () => {
  const repo = settlementRepo

  const CHAIN_ID = 1

  const mockSettlementForChain = (chainId: number = CHAIN_ID) => mockSettlement({ chainId })

  async function givenSettlementExists(overrides: Partial<Settlement> = {}) {
    const raw = mockSettlementForChain()
    const final = { ...raw, ...overrides }

    const { insertedId } = await settlements().insertOne(final)

    return {
      insertedId,
      settlement: final,
    }
  }

  // === test repo read ===

  describe('read', () => {
    it('findById returns expected doc', async () => {
      const { insertedId, settlement } = await givenSettlementExists()

      const row = await repo.findById(insertedId)
      if (!row) throw new Error('row missing')

      expect(row._id).toBeInstanceOf(ObjectId)
      expect(row).toMatchObject(settlement)
    })

    it('findBySettlementKey returns expected doc for chainId + orderHash', async () => {
      const settlement = (await givenSettlementExists()).settlement
      const { chainId, orderHash } = settlement

      const row = await repo.findBySettlementKey({ chainId, orderHash })
      if (!row) throw new Error('row missing')

      expect(row).toMatchObject(settlement)
    })

    describe('findPendingMeta', () => {
      it('returns only pending settlements for target chain', async () => {
        const target = {
          chainId: 1,
          count: {
            pending: 3,
            done: 5,
            failed: 7,
          },
        }

        // Seed settlements with every metaStatus on target chain
        await seedSettlements(target.chainId, 'pending', target.count.pending, 0, {
          metaStatus: 'PENDING',
        })
        await seedSettlements(target.chainId, 'done', target.count.done, 0, {
          metaStatus: 'DONE',
        })
        await seedSettlements(target.chainId, 'failed', target.count.failed, 0, {
          metaStatus: 'FAILED',
        })

        // Seed pending settlements on other chain
        await seedSettlements(31337, 'ignore', 10, 0, { metaStatus: 'PENDING' })

        const result = await repo.findPendingMeta(target.chainId, 100)

        expect(result).toHaveLength(target.count.pending)
        expect(result.every(s => s.chainId === target.chainId)).toBe(true)
      })

      it('respects limit - returns at most limit items', async () => {
        const chainId = 1
        const limit = 2

        // Seed 5 pending settlements
        await seedSettlements(chainId, 'pending', 5, 0, { metaStatus: 'PENDING' })

        const result = await repo.findPendingMeta(chainId, limit)

        expect(result).toHaveLength(limit)
      })

      it('returns empty array when no pending settlements exist', async () => {
        // seed only non-pending
        await seedSettlements(CHAIN_ID, 'done', 3, 0, { metaStatus: 'DONE' })

        const result = await repo.findPendingMeta(CHAIN_ID, 10)

        expect(result).toEqual([])
      })
    })
  })

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
      it('inserts settlement on unique chainId + orderHash pair', async () => {
        const settlement = mockSettlementForChain()

        const { insertedId } = await repo.save(settlement)
        expect(insertedId).toBeInstanceOf(ObjectId)

        const rows = await settlements().find({}).toArray()
        expect(rows).toHaveLength(1)

        const inserted = rows[0]
        expect(inserted).toMatchObject({
          ...settlement,
          ingestedAt: startTime,
        })
      })

      it('throws error on duplicate chainId + orderHash pair', async () => {
        const { settlement, insertedId } = await givenSettlementExists() // first insert

        await expect(repo.save(settlement)).rejects.toThrow() // attempt second insert
      })

      it('allows same orderHash on different chains', async () => {
        const base = mockSettlementForChain(1)
        const other = { ...base, chainId: 31337 }

        await repo.save(base)
        await repo.save(other)

        const rows = await settlements().find({ orderHash: base.orderHash }).toArray()

        expect(rows).toHaveLength(2)

        const chainIds = rows.map(r => r.chainId).sort((a, b) => a - b) // ascending
        expect(chainIds).toEqual([1, 31337])
      })
    })

    describe('meta / status writers', () => {
      describe('finalizeMeta', () => {
        it('updates an existing settlement with metadata and marks it DONE', async () => {})

        it('does not upsert settlement when no match is found', async () => {
          const res = await repo.finalizeMeta({
            chainId: CHAIN_ID,
            orderHash: bytes32('o_hash'),
            meta: mockSettlementMeta,
          })

          expect(res.acknowledged).toBe(true)
          expect(res.matchedCount).toBe(0)

          expect(res.modifiedCount).toBe(0)
          expect(res.upsertedCount).toBe(0)

          const rows = await settlements().find({}).toArray()
          expect(rows).toHaveLength(0)
        })

        it('does not overwrite existing execution data ', async () => {})
      })

      describe('markMetaFailed', () => {
        it('marks an existing settlement meta as FAILED and stores the error message')

        it('does not modify execution data or orderAttributes', async () => {
          const existingExecution = {
            blockNumber: 100,
            logIndex: 2,
            block: { timestamp: 123456 },
          }

          const existingAttributes = {
            collection: 'Kitz',
            tokenId: '1',
          }

          const meta = mockSettlementMeta
        })
        it('overwrites the previous metaError on retry')
      })
    })
  })
})
