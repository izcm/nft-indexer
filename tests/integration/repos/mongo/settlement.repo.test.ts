import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { settlements } from '#app/db/collections.js'

import type { Hash } from '#app/domain/shared/types/eth.js'
import { Status } from '#app/domain/shared/status.js'

import type { DeepPartial } from '#app/lib/utils/deep-partial.js'
import { settlementRepo } from '#app/repos/mongo/settlement.repo.js'

import { bytes32 } from '#tests/helpers/evm-fixtures.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo/mongo-memory.js'
import { fakeSettlementCall } from '#tests/helpers/fixtures.js'
import { SettlementDoc } from '#app/repos/mongo/docs.js'
import { seedSettlements } from '#tests/helpers/mongo/seed-mongo.js'
import { fakeSettlementDoc } from '#tests/helpers/mongo/to-doc.js'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await settlements().deleteMany()
})

describe('settlementRepo', () => {
  const repo = settlementRepo

  const CHAIN_ID = 1

  const fakeSettlementDocForChain = (chainId: number = CHAIN_ID) => fakeSettlementDoc({ chainId })

  async function givenSettlementDocDocExists(overrides: DeepPartial<SettlementDoc> = {}) {
    const seed = `given:${Math.random().toString(36).slice(2)}`

    const result = await seedSettlements(CHAIN_ID, seed, 1, 0, overrides)

    const insertedId = result.insertedIds[0]

    const settlement = await settlements().findOne({ _id: insertedId })
    if (!settlement) throw new Error('failed to fetch seeded settlement')

    return {
      insertedId,
      settlement,
    }
  }

  // === test repo read ===

  describe('read', () => {
    describe('findBySettlementDocKey', () => {
      it('returns existing doc with chainId + orderHash', async () => {
        const settlement = (await givenSettlementDocDocExists()).settlement
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
    describe('findPage', () => {
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
          cursor: undefined,
          sortDir: 'asc',
          sortField: 'createdAt',
          rangeField: 'createdAt',
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

        // Seed settlements with every callReconstruction status on target chain
        await seedSettlements(target.chainId, 'pending', target.count.pending, 0, {
          execution: {
            callReconstruction: { status: Status.PENDING },
          },
        })
        await seedSettlements(target.chainId, 'done', target.count.done, 0, {
          execution: {
            callReconstruction: { status: Status.DONE },
          },
        })
        await seedSettlements(target.chainId, 'failed', target.count.failed, 0, {
          execution: {
            callReconstruction: { status: Status.FAILED },
          },
        })

        // Seed pending settlements on other chain
        await seedSettlements(31337, 'ignore', 10, 0, {
          execution: {
            callReconstruction: { status: Status.PENDING },
          },
        })

        const items = await repo.findPendingCallReconstruction(target.chainId, 100)

        expect(items).toHaveLength(target.count.pending)
        expect(items.every(s => s.chainId === target.chainId)).toBe(true)
      })

      it('respects limit - returns at most limit items', async () => {
        const chainId = 1
        const limit = 2

        // Seed 5 pending settlements
        await seedSettlements(chainId, 'pending', 5, 0, {
          execution: {
            callReconstruction: { status: Status.PENDING },
          },
        })

        const items = await repo.findPendingCallReconstruction(chainId, limit)

        expect(items).toHaveLength(limit)
      })

      it('returns empty array when no pending settlements exist', async () => {
        // seed only non-pending
        await seedSettlements(CHAIN_ID, 'done', 3, 0, {
          execution: {
            callReconstruction: { status: Status.DONE },
          },
        })

        const items = await repo.findPendingCallReconstruction(CHAIN_ID, 10)

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
        const settlement = fakeSettlementDocForChain()

        const { insertedId } = await repo.save(settlement)
        expect(insertedId).toBeInstanceOf(ObjectId)

        const rows = await settlements().find().toArray()
        expect(rows).toHaveLength(1)

        const inserted = rows[0]
        expect(inserted).toMatchObject(settlement)
      })

      it('throws error on duplicate chainId + orderHash pair', async () => {
        const { settlement, insertedId } = await givenSettlementDocDocExists() // first insert

        await expect(repo.save(settlement)).rejects.toThrow() // attempt second insert
      })

      it('allows same orderHash on different chains', async () => {
        const base = fakeSettlementDocForChain(1)
        const other = { ...base, chainId: 31337 }

        await repo.save(base)
        await repo.save(other)

        const rows = await settlements().find({ orderHash: base.orderHash }).toArray()

        expect(rows).toHaveLength(2)

        const chainIds = rows.map(r => r.chainId).sort((a, b) => a - b) // ascending
        expect(chainIds).toEqual([1, 31337])
      })
    })

    describe('callReconstruction builders', () => {
      const readCR = (s: SettlementDoc) => s.execution.callReconstruction

      describe('finalizeCallReconstruction', () => {
        it('updates an existing settlement call reconstruction and marks it DONE', async () => {
          const { settlement } = await givenSettlementDocDocExists({
            execution: { callReconstruction: { status: Status.PENDING } },
          })
          const meta = fakeSettlementCall()

          const result = await repo.finalizeCallReconstruction({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            meta,
          })

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          const cr = readCR(updated)
          expect(cr.status).toBe(Status.DONE)
          expect(cr.data?.txContext).toEqual(meta.txContext)
        })

        it('does not upsert when settlement does not exist', async () => {
          await repo.finalizeCallReconstruction({
            chainId: 1,
            orderHash: bytes32('o_hash') as Hash,
            meta: fakeSettlementCall(),
          })

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

          const { settlement } = await givenSettlementDocDocExists({
            execution: {
              ...existingExecution,
              callReconstruction: { status: Status.PENDING },
            },
          })

          const meta = fakeSettlementCall()

          await repo.finalizeCallReconstruction({
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

      describe('markCallReconstructionFailed', () => {
        it('marks an existing settlement call reconstruction as FAILED and stores the error message', async () => {
          const { settlement } = await givenSettlementDocDocExists({
            execution: { callReconstruction: { status: Status.PENDING } },
          })
          const errorMessage = 'some error'

          await repo.markCallReconstructionFailed({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            error: errorMessage,
          })

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          const cr = readCR(updated)
          expect(cr.status).toBe(Status.FAILED)
          expect(cr.error).toBe(errorMessage)
        })

        it('overwrites the previous error on retry', async () => {
          const firstError = 'first'
          const secondError = 'second'

          const { settlement } = await givenSettlementDocDocExists({
            execution: {
              callReconstruction: { status: Status.FAILED, error: firstError },
            },
          })

          await repo.markCallReconstructionFailed({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
            error: secondError,
          })

          const updated = await settlements().findOne({
            chainId: settlement.chainId,
            orderHash: settlement.orderHash,
          })
          if (!updated) throw new Error('row missing')

          expect(readCR(updated).error).toBe(secondError)
        })
      })
    })
  })
})
