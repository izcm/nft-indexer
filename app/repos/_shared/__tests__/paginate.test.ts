import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPageGeneric } from '../paginate.js'
import { buildCursorFilter, encodeCursor, walkPath } from '../cursor.js'
import { GenericPageArgs } from '../types.js'

vi.mock(import('../cursor.js'), () => ({
  buildSortSpec: vi.fn(),
  walkPath: vi.fn(),
  encodeCursor: vi.fn(),
  buildCursorFilter: vi.fn(),
}))

describe('findPageGeneric', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ------ helpers ------

  const makeDocs = (count: number = 3) =>
    Array.from({ length: count }).map((_, i) => ({ _id: `abc_${i}`, ts: i }))

  const makeArgs = (
    collection: any,
    docs: any[],
    overrides: Partial<GenericPageArgs> = {}
  ): GenericPageArgs => ({
    collection,
    baseQuery: {},
    sortField: 'ts',
    sortDir: -1,
    limit: docs.length,
    cursor: null,
    ...overrides,
  })

  function mockQueryCursor(docs: any[]) {
    const cursor = {
      sort: vi.fn(),
      limit: vi.fn(),
      toArray: vi.fn(),
    }
    cursor.sort.mockReturnValue(cursor)
    cursor.limit.mockReturnValue(cursor)
    cursor.toArray.mockResolvedValue(docs)

    return cursor
  }

  function setup(docs = makeDocs()) {
    const queryCursor = mockQueryCursor(docs)
    const find = vi.fn().mockReturnValue(queryCursor)
    const collection = { find } as any

    return { docs, queryCursor, find, collection }
  }

  async function runPage({
    docs = makeDocs(),
    cursorFilter = null,
    args = {},
  }: {
    docs?: any[]
    cursorFilter?: any
    args?: Partial<GenericPageArgs>
  }) {
    const ctx = setup(docs)

    vi.mocked(buildCursorFilter).mockReturnValueOnce(cursorFilter)

    const result = await findPageGeneric(makeArgs(ctx.collection, docs, args))

    return { ...ctx, result }
  }

  /* ======================================
    query building
  ====================================== */

  describe('query building', () => {
    it('does not create nextCursor when page is final', async () => {
      const { result } = await runPage({ docs: makeDocs(1), args: { limit: 2 } })

      expect(result.nextCursor).toBeNull()
    })

    it('adds cursor filter to query when cursor is provided', async () => {
      const cursorFilter = { foo: 1 }
      const { find } = await runPage({ cursorFilter })

      expect(find).toHaveBeenCalledWith({
        $and: [cursorFilter],
      })
    })

    it.each([
      // case 1: baseQuery has normal fields, no $and
      [{ foo1: 123 }, { foo1: 123, $and: [{ foo: 1 }] }],

      // case 2: baseQuery already has $and
      [{ $and: [{ foo2: 'bar' }] }, { $and: [{ foo2: 'bar' }, { foo: 1 }] }],
    ])('merges cursor filter into $and correctly', async (baseQuery, expectedQuery) => {
      const { find } = await runPage({
        cursorFilter: { foo: 1 },
        args: {
          baseQuery,
        },
      })

      const [query] = find.mock.lastCall!
      expect(query).toEqual(expectedQuery)
    })
  })

  /* ======================================
    pagination result
  ====================================== */

  describe('pagination result', () => {
    it('returns null nextCursor when results do not exceed limit', async () => {
      const { collection, docs } = setup()

      const res = await findPageGeneric(makeArgs(collection, docs, { limit: docs.length + 1 }))

      expect(res.items).toEqual(docs)
      expect(res.nextCursor).toBeNull()
    })

    it('returns nextCursor when results exceeds limit', async () => {
      const limit = 2
      const docs = makeDocs(limit + 1)

      const { collection } = setup(docs)

      vi.mocked(walkPath).mockReturnValueOnce(123)
      vi.mocked(encodeCursor).mockReturnValueOnce('CURSOR')

      const res = await findPageGeneric(makeArgs(collection, docs, { limit }))

      expect(res.nextCursor).toBe('CURSOR')
    })

    it('slices items to limit', async () => {
      const limit = 5
      const docs = makeDocs(limit + 1)

      const { collection } = setup(docs)

      const res = await findPageGeneric(makeArgs(collection, docs, { limit }))

      expect(res.items).toHaveLength(limit)
      expect(res.items).toEqual(docs.slice(0, limit))
    })
  })
})
