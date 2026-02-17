import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPageGeneric } from '../paginate.js'
import { buildCursorFilter, buildSortSpec, encodeCursor, walkPath } from '../cursor.js'
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
    dbCollection: any,
    docs: any[],
    overrides: Partial<GenericPageArgs> = {}
  ): GenericPageArgs => ({
    dbCollection,
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
    const dbCollection = { find } as any

    return { docs, queryCursor, find, dbCollection }
  }

  async function runPage({
    docs = makeDocs(),
    args = {},
  }: {
    docs?: any[]
    args?: Partial<GenericPageArgs>
  } = {}) {
    const ctx = setup(docs)

    const result = await findPageGeneric(makeArgs(ctx.dbCollection, docs, args))

    return { ...ctx, result }
  }

  /* ======================================
    query building
  ====================================== */

  describe('query building', () => {
    const setCursorFilter = (cf: any) => vi.mocked(buildCursorFilter).mockReturnValueOnce(cf as any)

    it('does not create nextCursor when page is final', async () => {
      const { result } = await runPage({ docs: makeDocs(1), args: { limit: 2 } })

      expect(result.nextCursor).toBeNull()
    })

    it('adds cursor filter to query $and condition when cursor is provided', async () => {
      const cursorFilter = { foo: 1 }
      setCursorFilter(cursorFilter)

      const { find } = await runPage()

      const [query] = find.mock.lastCall!
      expect(query.$and).toEqual([{ foo: 1 }])
    })

    it('does not add $and when cursor filter is null', async () => {
      setCursorFilter(null)

      const { find } = await runPage({ args: { baseQuery: { foo: 'bar' } } })

      const [query] = find.mock.lastCall!
      expect(query.$and).toBeUndefined()
    })

    it.each([
      // case 1: baseQuery has normal fields, no $and
      [{ foo1: 123 }, { foo1: 123, $and: [{ baz: 1 }] }],

      // case 2: baseQuery already has $and
      [{ $and: [{ foo: 'bar' }] }, { $and: [{ foo: 'bar' }, { baz: 1 }] }],
    ])('merges cursor filter into $and correctly', async (baseQuery, expectedQuery) => {
      setCursorFilter({ baz: 1 })

      const { find } = await runPage({
        args: {
          baseQuery,
        },
      })

      const [query] = find.mock.lastCall!
      expect(query).toEqual(expectedQuery)
    })
  })

  /* ======================================
    query cursor usage
  ====================================== */

  describe('query cursor usage', () => {
    it('calls sort with sortSpec', async () => {
      const sortSpec = { foo: -1, bar: -1 }

      vi.mocked(buildSortSpec).mockReturnValueOnce(sortSpec as any)

      const { queryCursor } = await runPage()

      expect(queryCursor.sort).toHaveBeenCalledExactlyOnceWith(sortSpec)
    })

    it('requests limit + 1 documents', async () => {
      const limit = 100

      const { queryCursor } = await runPage({ args: { limit } })

      expect(queryCursor.limit).toHaveBeenCalledExactlyOnceWith(limit + 1)
    })
  })

  /* ======================================
    pagination result
  ====================================== */

  describe('pagination result', () => {
    it('returns null nextCursor when results do not exceed limit', async () => {
      const { dbCollection, docs } = setup()

      const res = await findPageGeneric(makeArgs(dbCollection, docs, { limit: docs.length + 1 }))

      expect(res.items).toEqual(docs)
      expect(res.nextCursor).toBeNull()
    })

    it('returns nextCursor when results exceeds limit', async () => {
      const limit = 2
      const docs = makeDocs(limit + 1)

      const { dbCollection } = setup(docs)

      vi.mocked(walkPath).mockReturnValueOnce(123)
      vi.mocked(encodeCursor).mockReturnValueOnce('CURSOR')

      const res = await findPageGeneric(makeArgs(dbCollection, docs, { limit }))

      expect(res.nextCursor).toBe('CURSOR')
    })

    it('slices items to limit', async () => {
      const limit = 5
      const docs = makeDocs(limit + 1)

      const { dbCollection } = setup(docs)

      const res = await findPageGeneric(makeArgs(dbCollection, docs, { limit }))

      expect(res.items).toHaveLength(limit)
      expect(res.items).toEqual(docs.slice(0, limit))
    })
  })
})
