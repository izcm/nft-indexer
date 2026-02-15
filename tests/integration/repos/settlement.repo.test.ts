import { vi, afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { Hex } from 'viem'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { settlements } from '#app/db/collections.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { seedSettlements } from '#tests/helpers/seed/seed-settlements.js'
import { Settlement } from '#app/domain/settlement/types.js'
import { mockSettlement } from '#tests/mocks/primitives.js'
import { ObjectId } from 'mongodb'

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
  const CHAIN_ID = 1

  const repo = settlementRepo

  async function givenSettlementExists(overrides: Partial<Settlement> = {}) {
    const settlement = mockSettlement()
    const { insertedId } = await settlements().insertOne(settlement)

    return {
      insertedId,
      settlement,
    }
  }

  // === test repo read ===

  describe('read', () => {
    it('findById returns expected dox', async () => {
      const { insertedId, settlement } = await givenSettlementExists()

      const row = await repo.findById(insertedId)
      if (!row) throw new Error('row missing')

      expect(row._id).toBeInstanceOf(ObjectId)
      expect(row).toMatchObject(settlement)
    })

    it('findBySettlementKey returns expected doc for chainId + orderHash', async () => {
      const { settlement } = await givenSettlementExists()
      const { chainId, orderHash } = settlement

      const row = await repo.findBySettlementKey({ chainId, orderHash })
      if (!row) throw new Error('row missing')

      expect(row).toMatchObject(settlement)
    })
  })
})
