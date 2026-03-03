import { Side } from '#app/domain/order/model.js'
import { describe, expect, it } from 'vitest'
import { toOrderType } from '../rules.js'

// === tests ===

describe('Side enum', () => {
  it('has stable numeric mapping', () => {
    expect(Side.ASK).toBe(0)
    expect(Side.BID).toBe(1)
  })

  it('maps numeric -> label via reverse enum', () => {
    expect(Side[0]).toBe('ASK')
    expect(Side[1]).toBe('BID')
  })
})

describe('toOrderType', () => {
  it('returns ASK for ask side', () => {
    expect(toOrderType(Side.ASK, false)).toBe('ASK')
  })

  it('returns BID for bid side without collection flag', () => {
    expect(toOrderType(Side.BID, false)).toBe('BID')
  })

  it('returns COLLECTION_BID for bid + collection flag', () => {
    expect(toOrderType(Side.BID, true)).toBe('COLLECTION_BID')
  })

  it('does not return COLLECTION_BID for ASK even if flag is true', () => {
    expect(toOrderType(Side.ASK, true)).not.toBe('COLLECTION_BID')
  })
})
