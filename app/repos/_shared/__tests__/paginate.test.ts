import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCursorFilter, buildSortSpec, encodeCursor, walkPath } from '../cursor.js'
import { findPageGeneric } from '../paginate.js'
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

    const res = await findPageGeneric(makeArgs(ctx.dbCollection, docs, args))

    return { ...ctx, res }
  }

  /* ======================================
    query building
  ====================================== */

  describe('query building', () => {
    const givenCursorFilter = (cf: any) => vi.mocked(buildCursorFilter).mockReturnValueOnce(cf)

    it('adds cursor filter to query $and condition when cursor is provided', async () => {
      const cursorFilter = { foo: 1 }
      givenCursorFilter(cursorFilter)

      const { find } = await runPage()

      const [query] = find.mock.lastCall!
      expect(query.$and).toEqual([{ foo: 1 }])
    })

    it('does not add $and when cursor filter is null', async () => {
      givenCursorFilter(null)

      const { find } = await runPage({ args: { baseQuery: { foo: 'bar' } } })

      const [query] = find.mock.lastCall!
      expect(query.$and).toBeUndefined()
    })

    it.each([
      ['no existing $and', { foo1: 123 }, { foo1: 123, $and: [{ baz: 1 }] }],
      ['existing $and', { $and: [{ foo: 'bar' }] }, { $and: [{ foo: 'bar' }, { baz: 1 }] }],
    ])('merges cursor filter into $and correctly (%s)', async (_, baseQuery, expectedQuery) => {
      givenCursorFilter({ baz: 1 })

      const { find } = await runPage({
        args: {
          baseQuery,
        },
      })

      const [query] = find.mock.lastCall!
      expect(query).toEqual(expectedQuery)
    })

    it('does not mutate baseQuery', async () => {
      const baseQuery = { $and: [{ foo: 'bar' }] }
      const snapshot = structuredClone(baseQuery)

      givenCursorFilter({ foo: 1 })

      await runPage({ args: { baseQuery } })

      expect(baseQuery).toEqual(snapshot)
    })

    it('passes cursor args into buildCursorFilter', async () => {
      await runPage({
        args: {
          cursor: '123_abc',
          sortField: 'ts',
          sortDir: -1,
        },
      })

      expect(buildCursorFilter).toHaveBeenCalledWith({
        sortField: 'ts',
        sortDir: -1,
        cursor: '123_abc',
      })
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

      expect(queryCursor.sort).toHaveBeenCalledWith(sortSpec)
    })

    it('requests limit + 1 documents', async () => {
      const limit = 100

      const { queryCursor } = await runPage({ args: { limit } })

      expect(queryCursor.limit).toHaveBeenCalledWith(limit + 1)
    })
  })

  /* ======================================
    nextCursor building
  ====================================== */

  describe('nextCursor building', () => {
    it('passes fieldValue and _id to encodeCursor', async () => {
      const docs = makeDocs(5)
      const limit = docs.length - 1

      const walkOut = 777
      vi.mocked(walkPath).mockReturnValue(walkOut)

      await runPage({ docs, args: { limit } })

      const last = docs[limit - 1]

      expect(encodeCursor).toHaveBeenCalledWith(walkOut, last._id)
    })

    it('does not generate cursor when page is final', async () => {
      const docs = makeDocs(5)

      await runPage({ docs, args: { limit: docs.length + 1 } })

      expect(encodeCursor).not.toHaveBeenCalled()
    })

    it('supports nested sortField path', async () => {
      const docs = [
        { _id: '1', foo: { bar: 5 } },
        { _id: '2', foo: { bar: 4 } },
        { _id: '3', foo: { bar: 3 } },
      ]

      vi.mocked(walkPath).mockImplementationOnce(obj => obj.foo.bar)
      vi.mocked(encodeCursor).mockReturnValueOnce('CUR')

      const { res } = await runPage({
        docs,
        args: { limit: docs.length - 1, sortField: 'foo.bar' },
      })

      expect(res.nextCursor).toBe('CUR')
    })
  })

  /* ======================================
    pagination result
  ====================================== */

  describe('pagination result', () => {
    const docs = makeDocs(5)
    const limitHasNext = docs.length - 1
    const limitNoNext = docs.length + 1

    it('returns null nextCursor when results do not exceed limit', async () => {
      const { res } = await runPage({ docs, args: { limit: limitNoNext } })

      expect(res.items).toEqual(docs)
      expect(res.nextCursor).toBeNull()
    })

    it('returns nextCursor when results exceeds limit', async () => {
      vi.mocked(walkPath).mockReturnValueOnce(123)
      vi.mocked(encodeCursor).mockReturnValueOnce('CURSOR')

      const { res } = await runPage({ docs, args: { limit: limitHasNext } })

      expect(res.nextCursor).toBe('CURSOR')
    })

    it('slices items to limit', async () => {
      const limit = limitHasNext

      const { res } = await runPage({ docs, args: { limit } })

      expect(res.items).toHaveLength(limit)
      expect(res.items).toEqual(docs.slice(0, limit))
    })

    it('handles limit 0 by throwing error', async () => {
      await expect(runPage({ args: { limit: 0 } })).rejects.toThrow('Invalid pagination limit')
    })
  })
})
