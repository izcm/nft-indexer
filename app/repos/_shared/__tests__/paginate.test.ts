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
  // --- ctx ---

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- test helpers ---

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

  // --- tests ---

  it('does not apply cursor filter in query when cursor is null', async () => {
    const { collection, docs, find } = setup()
    const args = makeArgs(collection, docs)

    vi.mocked(buildCursorFilter).mockReturnValueOnce(null)

    const res = await findPageGeneric(args)

    // assert return values
    expect(res.items).toEqual(docs)
    expect(res.nextCursor).toBeNull()

    // assert query shape
    expect(find).toHaveBeenCalledTimes(1)

    const [query] = find.mock.lastCall!
    expect(query.$and).toBeUndefined()
  })

  it('adds cursor filter to query when cursor is provided', async () => {
    const { collection, docs, find } = setup()
    const args = makeArgs(collection, docs)
    const cursorFilter = { foo: 1 }

    vi.mocked(buildCursorFilter).mockReturnValue(cursorFilter as any)

    const res = await findPageGeneric(args)

    expect(find).toHaveBeenCalledWith({
      $and: [cursorFilter],
    })
  })

  it('returns null nextCursor when results do not exceed limit', async () => {
    const { collection, docs, find } = setup()
    const args = makeArgs(collection, docs, { limit: docs.length + 1 })

    const res = await findPageGeneric(args)

    expect(res.items).toEqual(docs)
    expect(res.nextCursor).toBeNull()
  })

  it('returns nextCursor when results exceeds limit', async () => {
    const limit = 2
    const docs = makeDocs(limit + 1)

    const { collection, find } = setup(docs)
    const args = makeArgs(collection, docs, { limit })

    vi.mocked(walkPath).mockReturnValueOnce(123)
    vi.mocked(encodeCursor).mockReturnValueOnce('CURSOR')

    const res = await findPageGeneric(args)

    expect(res.nextCursor).toBe('CURSOR')
  })

  it('slices items to limit', async () => {
    const limit = 5
    const docs = makeDocs(limit + 1)

    const { collection } = setup(docs)
    const args = makeArgs(collection, docs, { limit })

    const res = await findPageGeneric(args)

    expect(res.items).toHaveLength(limit)
    expect(res.items).toEqual(docs.slice(0, limit))
  })

  it('merges cursor filter into existing $and conditions', async () => {
    const { collection, docs, find } = setup()
    const args = makeArgs(collection, docs, {
      baseQuery: {
        $and: [{ foo: 'bar' }],
      },
    })

    const cursorFilter = { baz: 1 }
    vi.mocked(buildCursorFilter).mockReturnValue(cursorFilter as any)

    await findPageGeneric(args)

    expect(find).toHaveBeenCalledTimes(1)

    const [query] = find.mock.lastCall!
    expect(query.$and).toEqual([{ foo: 'bar' }, cursorFilter])
  })
})
