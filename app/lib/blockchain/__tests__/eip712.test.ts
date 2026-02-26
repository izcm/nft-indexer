import { describe, expect, it } from 'vitest'

import { OrderCore } from '#app/domain/order/types.js'
import { toOrder712 } from '#app/lib/blockchain/eip712.js'
import { mockOrderCore } from '#tests/mocks/primitives.js'

describe('eip712 library', () => {
  const order = mockOrderCore()

  it('toOrder712 converts correctly', () => {
    const o712 = toOrder712(order)

    // Primitive fields should be copied as-is
    expect(o712.side).toBe(order.side)
    expect(o712.isCollectionBid).toBe(order.isCollectionBid)
    expect(o712.collection).toBe(order.collection)
    expect(o712.currency).toBe(order.currency)
    expect(o712.actor).toBe(order.actor)

    // String fields should be converted to BigInt
    expect(o712.tokenId).toBe(BigInt(order.tokenId))
    expect(o712.price).toBe(BigInt(order.price))
    expect(o712.start).toBe(BigInt(order.start))
    expect(o712.end).toBe(BigInt(order.end))
    expect(o712.nonce).toBe(BigInt(order.nonce))
  })
})
