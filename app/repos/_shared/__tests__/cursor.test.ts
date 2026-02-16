import { describe, it, expect } from 'vitest'
import { buildSortSpec, encodeCursor, walkPath } from '../cursor.js'
import { a } from 'node_modules/vitest/dist/chunks/suite.d.BJWk38HB.js'
import { ObjectId } from 'mongodb'

/* ======================================
    walkPath
====================================== */

describe('walkPath', () => {
  it('returns value at top-level property', () => {
    const obj = { a: 5 }

    expect(walkPath(obj, 'a')).toBe(5)
  })

  it('returns value at nested dotted value', () => {
    const obj = { a: { b: { c: 'hello' } } }

    expect(walkPath(obj, 'a.b.c')).toBe('hello')
  })

  it('returns undefined when a segment does not exist', () => {
    const obj = { a: { b: 2 } }

    expect(walkPath(obj, 'a.c')).toBeUndefined()
  })

  it('does not mutate original object', () => {
    const obj = { a: { b: 2 } }
    walkPath(obj, 'a.b')

    expect(obj).toEqual({ a: { b: 2 } })
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
})

describe('buildSortSpec', () => {
  it('sets primary and secondary sort field as expected', () => {
    const spec = buildSortSpec('primary', 1)

    const specKeys = Array.from(Object.keys(spec))

    expect(specKeys[0]).toBe('primary')
    expect(specKeys[1]).toBe('_id')
  })
})
