import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Collection } from 'mongodb'

import { getDb } from '#app/db/mongo.js'
import { GenericPageArgs } from '#app/repos/_shared/types.js'
import { bytes32n, priceWei } from '#app/lib/utils/evm-primitives.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { findPageGeneric } from '#app/repos/_shared/paginate.js'
import { walkPath } from '#app/repos/_shared/cursor.js'

type TestDoc = {
  foo: {
    bar: number
  }
  ts: number
}

let collection: Collection<TestDoc>

beforeAll(async () => {
  await startTestMongo()
  collection = getDb().collection('__paginate_test__')
})

beforeEach(async () => {
  await collection.deleteMany()
})

afterAll(async () => {
  await stopTestMongo()
})

describe('findPageGeneric (mongo integration)', () => {
  const makeArgs = (overrides: Partial<GenericPageArgs> = {}): GenericPageArgs => ({
    dbCollection: collection,
    baseQuery: {},
    sortField: 'ts',
    sortDir: 1,
    cursor: null,
    limit: 5,
    ...overrides,
  })

  async function seedTestDocs(count: number = 5, seed: string = 'seed') {
    const testDocs = Array.from({ length: count }).map((_, i) => {
      const iSeed = `${seed}:${i}`

      const determine = (x: string) => Number(bytes32n(x) % 9_000_000_000_000_000n) // js number 2^53

      return {
        foo: {
          bar: determine(`b:ts:${iSeed}`),
        },
        ts: determine(`c:ts:${iSeed}`),
      }
    })
    return collection.insertMany(testDocs)
  }

  async function assertNotPreSorted(sortField: string, dir: 1 | -1) {
    const docs = await collection.find().toArray()

    // walkPath tested in paginate unit tests
    const values = docs.map(d => walkPath(d, sortField))

    // ensure we don't mutate the original sequence
    const sorted = [...values].sort((a, b) => (dir === 1 ? a - b : b - a))

    expect(values).not.equals(sorted)
  }

  it('returns page in correct ascending order', async () => {
    const count = 10
    const args = makeArgs({ sortDir: 1, limit: count })

    await seedTestDocs(count)
    assertNotPreSorted(args.sortField, args.sortDir)

    const result = await findPageGeneric(args)

    const values = result.items.map(d => walkPath(d, args.sortField))
    const sorted = [...values].sort((a, b) => a - b)

    expect(result.items).toHaveLength(count)
    expect(values).toEqual(sorted)
  })

  it('returns empty result on empty collection', async () => {
    const result = await findPageGeneric(makeArgs())

    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
  })

  it('does not duplicate or skip when many docs share same sortField value', async () => {
    const total = 10
    const limit = 3

    await collection.insertMany(
      Array.from({ length: total }).map((_, i) => ({
        ts: 1000,
        foo: { bar: i },
      }))
    )

    let cursor: string | null = null
    const seen = new Set<string>()

    while (true) {
      const res = await findPageGeneric(makeArgs({ sortField: 'ts', limit, cursor }))

      for (const doc of res.items) {
        const id = String(doc._id)

        // duplicate detection
        expect(seen.has(id)).toBe(false)
        seen.add(id)
      }

      if (!res.nextCursor) break
      cursor = res.nextCursor
    }

    // skip detection
    expect(seen.size).toBe(total)
  })

  it('walks through all pages without skipping or duplicating', async () => {
    // keep calling findPageGeneric using the returned nextCursor
    // until it becomes null, and prove you saw every document exactly once.
  })
})
