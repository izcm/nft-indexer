import { describe, expect, it, vi } from 'vitest'
import { findPageGeneric } from '../paginate.js'
import { buildCursorFilter } from '../cursor.js'
import { GenericPageArgs } from '../types.js'

vi.mock(import('../cursor.js'), () => ({
  buildSortSpec: vi.fn(),
  walkPath: vi.fn(),
  encodeCursor: vi.fn(),
  buildCursorFilter: vi.fn(),
}))

describe('findPageGeneric', () => {
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

  it('skips cursor filter branch when cursor is null', async () => {
    const { collection, docs, find } = setup()
    const args = makeArgs(collection, docs)

    // --- find page ---

    const res = await findPageGeneric(args)

    expect(res.items).toEqual(docs)
    expect(res.nextCursor).toBeNull()

    expect(find).toHaveBeenCalledTimes(1)

    const [query] = find.mock.lastCall!
    expect(query.$and).toBeUndefined()
  })

  it('adds cursor filter to query when cursor is provided', async () => {
    const { collection, docs, find } = setup()

    const cursorFilter = { foo: 1 }

    vi.mocked(buildCursorFilter).mockReturnValue(cursorFilter as any)

    const res = await findPageGeneric(makeArgs(collection, docs))

    expect(find).toHaveBeenCalledWith({
      $and: [cursorFilter],
    })
  })

  it('returns null nextCursor when results do not exceed limit')
  it('returns nextCursor when more than limit documents are found')
  it('merges cursor filter into existing $and conditions')
})
