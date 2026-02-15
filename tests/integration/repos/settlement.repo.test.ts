import { vi, afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { Hex } from 'viem'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { settlements } from '#app/db/collections.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'

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
})
