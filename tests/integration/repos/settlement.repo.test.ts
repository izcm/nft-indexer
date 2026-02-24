import { settlements } from '#app/db/collections.js'
import type { Settlement } from '#app/domain/settlement/types.js'
import { bytes32 } from '#app/lib/utils/evm-primitives.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedSettlements } from '#tests/helpers/seed/seed-settlements.js'
import { mockSettlement, mockSettlementMeta } from '#tests/mocks/primitives.js'
import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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
    describe('findBydId', () => {
      it('returns existing doc id', async () => {
        const { insertedId, settlement } = await givenSettlementExists()

        const found = await repo.findById(insertedId)
        if (!found) throw new Error('row missing')

        expect(found._id).toBeInstanceOf(ObjectId)
        expect(found).toMatchObject(settlement)
      })

      it('returns null when doc with id does not exist', async () => {
        const id = new ObjectId()

        const found = await repo.findById(id)

        expect(found).toBeNull()
      })
    })

    describe('findBySettlementKey', () => {
      it('returns existing doc with chainId + orderHash', async () => {
        const settlement = (await givenSettlementExists()).settlement
        const { chainId, orderHash } = settlement

        const found = await repo.findByKey({ chainId, orderHash })
        if (!found) throw new Error('row missing')

        expect(found).toMatchObject(settlement)
      })

      it('returns null when doc with chainId + orderHash does not exist', async () => {
        const found = await repo.findByKey({
          chainId: CHAIN_ID,
          orderHash: bytes32('seed'),
        })

        expect(found).toBeNull()
      })
    })

    // findPageGeneric is extensively tested with both unit + seperate integration tests
    describe('findPage', async () => {
      it('filters settlement by block timestamp range', async () => {
        const cid = CHAIN_ID // lower noise

        // different timestamps
        await seedSettlements(cid, 'a', 1, 100)
        await seedSettlements(cid, 'b', 1, 200)
        await seedSettlements(cid, 'c', 1, 300)

        // only from + to are relevant for test
        const res = await repo.findPage({
          from: 150,
          to: 250,
          cursor: null,
          sortDir: 1,
          sortField: 'createdAt',
          limit: 100,
        })

        expect(res.items).toHaveLength(1)
        expect(res.items[0].execution.block.timestamp).toBe(200)
      })
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

        const items = await repo.findPendingMeta(target.chainId, 100)

        expect(items).toHaveLength(target.count.pending)
        expect(items.every(s => s.chainId === target.chainId)).toBe(true)
      })

      it('respects limit - returns at most limit items', async () => {
        const chainId = 1
        const limit = 2

        // Seed 5 pending settlements
        await seedSettlements(chainId, 'pending', 5, 0, { metaStatus: 'PENDING' })

        const items = await repo.findPendingMeta(chainId, limit)

        expect(items).toHaveLength(limit)
      })

      it('returns empty array when no pending settlements exist', async () => {
        // seed only non-pending
        await seedSettlements(CHAIN_ID, 'done', 3, 0, { metaStatus: 'DONE' })

        const items = await repo.findPendingMeta(CHAIN_ID, 10)

        expect(items).toEqual([])
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

        const rows = await settlements().find().toArray()
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
        it('updates an existing settlement with metadata and marks it DONE', async () => {
          const { settlement } = await givenSettlementExists({ metaStatus: 'PENDING' })
          const meta = mockSettlementMeta

          const result = await repo.finalizeMeta({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            meta,
          })

          expect(result.modifiedCount).toBe(1)

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          expect(updated.metaStatus).toBe('DONE')
          expect(updated.orderAttributes).toEqual(meta.order)
          expect(updated.execution.txContext).toEqual(meta.txContext)
        })

        it('does not upsert settlement does not exist', async () => {
          const result = await repo.finalizeMeta({
            chainId: 1,
            orderHash: bytes32('o_hash'),
            meta: mockSettlementMeta,
          })

          expect(result.acknowledged).toBe(true)
          expect(result.matchedCount).toBe(0)

          expect(result.modifiedCount).toBe(0)
          expect(result.upsertedCount).toBe(0)

          const rows = await settlements().find().toArray()
          expect(rows).toHaveLength(0)
        })

        it('does not overwrite existing execution data ', async () => {
          const existingExecution = {
            logIndex: 5,
            txHash: bytes32('existing:tx'),
            block: {
              number: 100,
              timestamp: 123456,
            },
          }

          const { settlement } = await givenSettlementExists({
            metaStatus: 'PENDING',
            execution: existingExecution,
          })

          const meta = mockSettlementMeta

          await repo.finalizeMeta({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            meta,
          })

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          expect(updated.execution.logIndex).toBe(existingExecution.logIndex)
          expect(updated.execution.txHash).toBe(existingExecution.txHash)
          expect(updated.execution.block).toEqual(existingExecution.block)
        })
      })

      describe('markMetaFailed', () => {
        it('marks an existing settlement meta as FAILED and stores the error message', async () => {
          const { settlement } = await givenSettlementExists({ metaStatus: 'PENDING' })
          const errorMessage = 'first'

          const result = await repo.markMetaFailed({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            error: errorMessage,
          })

          expect(result.modifiedCount).toBe(1)

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          expect(updated.metaStatus).toBe('FAILED')
          expect(updated.metaError).toBe(errorMessage)
        })

        it('does not modify execution data or orderAttributes', async () => {
          const existingExecution = {
            logIndex: 2,
            txHash: bytes32('existing:tx'),
            block: {
              number: 100,
              timestamp: 123456,
            },
          }

          const existingAttributes = mockSettlementMeta.order

          const { settlement } = await givenSettlementExists({
            metaStatus: 'DONE',
            execution: existingExecution,
            orderAttributes: existingAttributes,
          })

          const errorMessage = 'second'

          await repo.markMetaFailed({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            error: errorMessage,
          })

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          expect(updated.execution).toEqual(existingExecution)
          expect(updated.orderAttributes).toEqual(existingAttributes)
        })

        it('overwrites the previous metaError on retry', async () => {
          const firstError = 'first'
          const secondError = 'second'

          const { settlement } = await givenSettlementExists({
            metaStatus: 'FAILED',
            metaError: firstError,
          })

          await repo.markMetaFailed({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            error: secondError,
          })

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          expect(updated?.metaError).toBe(secondError)
        })
      })
    })
  })
})
