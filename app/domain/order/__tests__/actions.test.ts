import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeOrderRecord } from '#tests/helpers/fixtures.js'

import { isValidOrder } from '../rules.js'
import { makeOrderActions } from '../actions.js'

vi.mock('../rules.js', () => ({
  isValidOrder: vi.fn().mockResolvedValue(true),
}))

const fakeDeps = () => ({
  orders: {
    ensure: vi.fn(),
    updateStatus: vi.fn(),
    cancelOrdersByChainIdNonce: vi.fn(),
    count: vi.fn(),
  },
  nftCollections: {
    noteNFTCollection: vi.fn(),
    findByKey: vi.fn(),
    count: vi.fn(),
  },
})

describe('domain actions - orders', () => {
  let deps: ReturnType<typeof fakeDeps>
  let actions: ReturnType<typeof makeOrderActions>

  // clear out any stale state
  beforeEach(() => {
    deps = fakeDeps()
    actions = makeOrderActions(deps)
  })

  describe('order ingestion', () => {
    it('returns id + indicator on whether order was upserted and notes collection', async () => {
      const orderRecord = fakeOrderRecord()
      const { chainId, order } = orderRecord

      const expected = { chainId, orderHash: 'abc123', didUpsert: true }

      deps.orders.ensure.mockResolvedValueOnce(expected as any)
      deps.nftCollections.noteNFTCollection.mockResolvedValueOnce(undefined)

      const result = await actions.ingestOrder(chainId, order)

      expect(deps.orders.ensure).toHaveBeenCalledExactlyOnceWith(chainId, order)
      expect(deps.nftCollections.noteNFTCollection).toHaveBeenCalledExactlyOnceWith({
        chainId,
        address: order.collection,
      })
      expect(result).toEqual(expected)
    })
  })
})
