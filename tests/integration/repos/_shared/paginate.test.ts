import { Collection, ObjectId } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getDb } from '#app/db/mongo.js'
import { walkPath } from '#app/repos/mongo/shared/pagination/cursor.js'
import { findPageGeneric } from '#app/repos/mongo/shared/pagination/find-page-generic.js'
import type { GenericPageArgs } from '#app/repos/mongo/shared/pagination/types.js'
import type { Page } from '#app/domain/shared/types/page.js'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { bytes32n } from '#tests/helpers/evm-fixtures.js'

type TestDoc = {
  _id: ObjectId
  foo: {
    bar: number
  }
  ts: number
}

let collection: Collection<TestDoc>

beforeAll(async () => {
  await startTestMongo()
  collection = getDb().collection<TestDoc>('__paginate_test__')
})

beforeEach(async () => {
  await collection.deleteMany()
})

afterAll(async () => {
  await stopTestMongo()
})

describe('findPageGeneric (mongo integration)', () => {
  const makeArgs = (
    overrides: Partial<GenericPageArgs<TestDoc>> = {}
  ): GenericPageArgs<TestDoc> => ({
    dbCollection: collection,
    baseQuery: {},
    sortField: 'ts',
    sortDir: 1,
    cursor: undefined,
    limit: 5,
    ...overrides,
  })

  async function seedTestDocs(count: number = 5, seed: string = 'seed') {
    const testDocs: TestDoc[] = Array.from({ length: count }).map((_, i) => {
      const iSeed = `${seed}:${i}`

      const determine = (x: string) => Number(bytes32n(x) % 9_000_000_000_000_000n) // js number 2^53

      return {
        _id: new ObjectId(),
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

  describe('sorting', () => {
    it.each([
      ['ascending', 1 as const],
      ['descending', -1 as const],
    ])('returns page in correct order: %s', async (_, sortDir) => {
      const count = 10
      const args = makeArgs({ sortDir, sortField: 'ts', limit: count })

      await seedTestDocs(count)
      assertNotPreSorted(args.sortField, args.sortDir)

      const res = await findPageGeneric(args)

      const values = res.items.map(d => d.ts)

      const expected =
        sortDir === 1 ? [...values].sort((a, b) => a - b) : [...values].sort((a, b) => b - a)

      expect(values).toEqual(expected)
    })
  })

  it('returns empty result on empty collection', async () => {
    const result = await findPageGeneric(makeArgs())

    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
  })

  describe('cursor traversal', () => {
    async function walkAllPages(args: Partial<GenericPageArgs<TestDoc>>) {
      let cursor: string | undefined = undefined
      const seen = new Set<string>()

      while (true) {
        const res: Page<TestDoc> = await findPageGeneric(makeArgs({ ...args, cursor }))

        for (const doc of res.items) {
          const id = String(doc._id)

          // duplicate detection
          expect(seen.has(id)).toBe(false)
          seen.add(id)
        }

        if (!res.nextCursor) break
        cursor = res.nextCursor
      }

      return seen
    }

    it.each([1 as const, -1 as const])(
      'walks all pages correctly with sortDir=%i',
      async sortDir => {
        const total = 15
        const limit = 2

        await seedTestDocs(total)

        // duplicate detection
        const seen = await walkAllPages({ sortDir, limit })

        // skip detaction
        expect(seen.size).toBe(total)
      }
    )

    it.each([
      [
        'normal dataset',
        {
          sortField: 'ts',
          seed: seedTestDocs,
        },
      ],
      [
        'nested sortField path',
        {
          sortField: 'foo.bar',
          seed: seedTestDocs,
        },
      ],
      [
        'idential sortField values (requires sort on _id)',
        {
          sortField: 'ts',
          seed: async (total: number) => {
            await collection.insertMany(
              Array.from({ length: total }).map((_, i) => ({
                _id: new ObjectId(),
                ts: 1000,
                foo: { bar: i },
              }))
            )
          },
        },
      ],
    ])('walks all pages without skipping or duplicating: (%s)', async (_, { seed, sortField }) => {
      const total = 15
      const limit = 2

      await seed(total)

      // duplicate detection
      const seen = await walkAllPages({ sortField, limit })

      // skip detection
      expect(seen.size).toBe(total)
    })
  })
})
