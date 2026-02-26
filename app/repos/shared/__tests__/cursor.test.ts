import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { buildCursorFilter, buildSortSpec, encodeCursor, walkPath } from '../cursor.js'
import { CursorPageCore } from '../types.js'

/* ======================================
    walkPath
====================================== */

describe('walkPath', () => {
  // --- happy paths ---

  it('returns value at top-level property', () => {
    const obj = { a: 5 }

    expect(walkPath(obj, 'a')).toBe(5)
  })

  it('returns value at nested dotted value', () => {
    const obj = { a: { b: { c: 'hello' } } }

    expect(walkPath(obj, 'a.b.c')).toBe('hello')
  })

  it('does not mutate original object', () => {
    const obj = { a: { b: 2 } }
    walkPath(obj, 'a.b')

    expect(obj).toEqual({ a: { b: 2 } })
  })

  // --- unhappy paths ---

  it('returns undefined when path segment does not exist', () => {
    const obj = { a: { b: 2 } }

    expect(() => walkPath(obj, 'a.c')).not.toThrow()
    expect(walkPath(obj, 'a.c')).toBeUndefined()
  })

  it('returns undefined when intermediate value is null', () => {
    const obj = { a: { b: null } }

    expect(walkPath(obj, 'a.b.c')).toBeUndefined()
  })

  it('returns undefined when intermediate value is null', () => {
    const obj = { a: null }

    expect(walkPath(obj, 'a.b')).toBeUndefined()
  })

  it('returns undefined when object is empty', () => {
    const obj = {}

    expect(walkPath(obj, 'a.b')).toBeUndefined()
  })

  it('supports numeric keys (arrays)', () => {
    const obj = { a: [{ b: 10 }] }

    expect(walkPath(obj, 'a.0.b')).toBe(10)
  })
})

/* =======================================================
   encodeCursor
======================================================= */

describe('encodeCursor', () => {
  it('encodes value and ObjectId into a cursor string', () => {
    const id = new ObjectId()
    const cursor = encodeCursor(10, id)

    expect(cursor).toBe(`10_${id.toString()}`)
  })

  it('produces unique cursors for different ObjectIds', () => {
    const c1 = encodeCursor(5, new ObjectId())
    const c2 = encodeCursor(5, new ObjectId())

    expect(c1).not.toBe(c2)
  })

  it('produces unique cursors for different values with same ObjectId', () => {
    const id = new ObjectId()

    const c1 = encodeCursor(5, id)
    const c2 = encodeCursor(6, id)

    expect(c1).not.toBe(c2)
  })

  it('can be parsed back into value and objectId', () => {
    const id = new ObjectId()
    const cursor = encodeCursor(5, id)

    const [value, rawId] = cursor.split('_')

    expect(Number(value)).toBe(5)
    expect(new ObjectId(id)).toEqual(id)
  })
})

/* =======================================================
   buildSortSpec
======================================================= */

describe('buildSortSpec', () => {
  it('sets primary and secondary sort field as expected', () => {
    const spec = buildSortSpec('primary', 1)

    const specKeys = Object.keys(spec)

    expect(specKeys[0]).toBe('primary')
    expect(specKeys[1]).toBe('_id')
  })

  function testDirection(dir: 1 | -1) {
    const spec = buildSortSpec('sortField', dir)
    const dirs = Object.values(spec)
    expect(dirs).toEqual([dir, dir])
  }

  it('sets ascending direction for primary and secondary sort key', () => {
    testDirection(1)
  })

  it('sets descending direction for primary and secondary sort key', () => {
    testDirection(-1)
  })
})

/* =======================================================
   buildCursorFilter
======================================================= */

describe('buildCursorFilter', () => {
  function buildBaseTest(overrides: Partial<Omit<CursorPageCore, 'limit'>> = {}): {
    id: ObjectId
    sortKeyValue: number
    cursor: string
    sortKeyName: string
    res: any
  } {
    const id = new ObjectId()
    const sortKeyValue = 1

    const sortKeyName = overrides.sortField ?? 'sortField'
    const cursor = overrides.cursor ?? `${sortKeyValue}_${id}`
    const sortDir = overrides.sortDir ?? 1

    const res = buildCursorFilter({ sortField: sortKeyName, sortDir, cursor })
    if (!res) throw new Error("didn't build cursor")

    return { id, sortKeyValue, cursor, sortKeyName, res }
  }

  it('returns null when cursor is not provided', () => {
    const res = buildCursorFilter({ sortField: 'field', sortDir: 1, cursor: null })
    expect(res).toBeNull()
  })

  it('uses $gt for ascending order', () => {
    const { id, sortKeyValue, sortKeyName, res } = buildBaseTest()

    expect(res.$or[0]).toStrictEqual({ [sortKeyName]: { $gt: sortKeyValue } })
    expect(res.$or[1]).toStrictEqual({ [sortKeyName]: sortKeyValue, _id: { $gt: id } })
  })

  it('uses $lt for descending order', () => {
    const { id, sortKeyValue, sortKeyName, res } = buildBaseTest({ sortDir: -1 })

    expect(res.$or[0]).toStrictEqual({ [sortKeyName]: { $lt: sortKeyValue } })
    expect(res.$or[1]).toStrictEqual({ [sortKeyName]: sortKeyValue, _id: { $lt: id } })
  })

  it('throws on malformed cursor', () => {
    expect(() => buildCursorFilter({ sortField: 'x', sortDir: 1, cursor: 'bad_cursor' })).toThrow()
  })
})
