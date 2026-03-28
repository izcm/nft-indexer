import { describe, expect, it } from 'vitest'
import { sanitizeAttributes, parseTokenUri } from '../logic.js'

describe('parseTokenUri', () => {
  const makeTokenUri = (obj: unknown): string => {
    const json = JSON.stringify(obj)
    const base64 = btoa(json)
    return `data:application/json;base64,${base64}`
  }

  // === happy paths ===

  it('parses valid tokenUri', () => {
    const data = {
      name: 'a',
      description: 'b',
      image: 'ipfs://x',
      attributes: [],
    }

    const uri = makeTokenUri(data)
    const result = parseTokenUri(uri)

    expect(result).toEqual(data)
  })

  it('drops invalid fields', () => {
    const data = {
      name: 123,
      description: null,
      image: 'ok',
      attributes: [],
    }

    const uri = makeTokenUri(data)
    const result = parseTokenUri(uri)

    expect(result?.name).toBeUndefined()
    expect(result?.description).toBeUndefined()
    expect(result?.image).toBe('ok')
  })

  it('handles missing fields', () => {
    const uri = makeTokenUri({})

    const result = parseTokenUri(uri)

    expect(result).toEqual({
      name: undefined,
      description: undefined,
      image: undefined,
      attributes: [],
    })
  })

  // === sad paths ===

  it('returns null when prefix is invalid', () => {
    const result = parseTokenUri('not:base64')
    expect(result).toBeNull()
  })

  it('returns null on invalid base64', () => {
    const uri = 'data:application/json;base64,not-base64'
    expect(parseTokenUri(uri)).toBeNull()
  })
})

describe('sanitizeAttributes', () => {
  const validAttributes = () => [
    { trait_type: 'foo', value: 'bar' },
    { trait_type: 'bar', value: 'foo' },
  ]

  const invalidAttributes = () => [{ something: 1 }, null, 'lol', 123]

  // === happy paths ===

  it('parses valid input into array of attributes', () => {
    const input = validAttributes()
    const result = sanitizeAttributes(input)

    expect(result).toHaveLength(input.length)
    expect(result).toEqual(input)
  })

  it('filters out invalid attributes but keep valid ones', () => {
    const input = [...validAttributes(), ...invalidAttributes()]
    const result = sanitizeAttributes(input)

    expect(result).toHaveLength(validAttributes().length)
    expect(result).toEqual(validAttributes())
  })

  // === sad paths ===

  it('returns empty array when invalid format', () => {
    const input = invalidAttributes()
    const result = sanitizeAttributes(input)

    expect(result).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(sanitizeAttributes([])).toEqual([])
  })

  it('returns empty array when input is not array', () => {
    const result = sanitizeAttributes('attributes')
    expect(result).toEqual([])
  })
})
