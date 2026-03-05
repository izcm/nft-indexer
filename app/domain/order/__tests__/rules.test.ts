import { OrderSide } from '../model.js'
import { describe, expect, it } from 'vitest'
import { toOrderType } from '../rules.js'

// === tests ===

describe('Side enum', () => {
  it('has stable numeric mapping', () => {
    expect(OrderSide.ASK).toBe(0)
    expect(OrderSide.BID).toBe(1)
  })

  it('maps numeric -> label via reverse enum', () => {
    expect(OrderSide[0]).toBe('ASK')
    expect(OrderSide[1]).toBe('BID')
  })
})

describe('toOrderType', () => {
  it('returns ASK for ask side', () => {
    expect(toOrderType(OrderSide.ASK, false)).toBe('ASK')
  })

  it('returns BID for bid side without collection flag', () => {
    expect(toOrderType(OrderSide.BID, false)).toBe('BID')
  })

  it('returns COLLECTION_BID for bid + collection flag', () => {
    expect(toOrderType(OrderSide.BID, true)).toBe('COLLECTION_BID')
  })

  it('does not return COLLECTION_BID for ASK even if flag is true', () => {
    expect(toOrderType(OrderSide.ASK, true)).not.toBe('COLLECTION_BID')
  })
})
