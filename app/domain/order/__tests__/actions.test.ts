import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeOrder, fakeOrderRecord } from '#tests/helpers/fixtures.js'

import { makeOrderActions } from '../actions.js'
import { Order } from '../model.js'

const { isValidOrder } = vi.hoisted(() => ({
  isValidOrder: vi.fn().mockResolvedValue(true),
}))

vi.mock('../rules.js', () => ({
  isValidOrder,
}))

let isStrict = false

vi.mock('#app/config/app.js', () => ({
  get STRICT_INGESTION() {
    return isStrict
  },
}))

const fakeDeps = () => ({
  orders: {
    ensure: vi.fn().mockResolvedValue({
      chainId: 123n,
      orderHash: '0xabc',
      didUpsert: false,
    }),
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
    isStrict = false
    deps = fakeDeps()
    actions = makeOrderActions(deps)
  })

  describe('ingestOrder', () => {
    const callIngest = async (chainId: number = 123, order: Order = fakeOrder()) => {
      await actions.ingestOrder(chainId, order)
    }

    describe('rule enforcement when STRICT_INGESTION flag is set', () => {
      beforeEach(() => {
        isStrict = true
      })

      it('allows order when no nftCollection is persisted to db', async () => {
        deps.nftCollections.count.mockResolvedValueOnce(0)
        await callIngest()
        expect(isValidOrder).toHaveBeenCalled()
      })

      describe('when min 1 nftCollection is persisted to db', () => {
        beforeEach(() => {
          deps.nftCollections.count.mockResolvedValueOnce(1)
        })

        it('resumes for order with known collection', async () => {
          deps.nftCollections.findByKey.mockResolvedValue(true)
          await callIngest()
          expect(isValidOrder).toHaveBeenCalled()
        })

        it('throws for order with unknown collection', async () => {
          deps.nftCollections.findByKey.mockResolvedValue(null)
          await expect(callIngest()).rejects.toThrow(
            expect.objectContaining({
              message: 'Collection not supported.',
            })
          )
        })
      })
    })

    it('returns id + indicator on whether order was upserted and notes collection', async () => {
      const orderRecord = fakeOrderRecord()
      const { chainId, order } = orderRecord

      const expected = { chainId, orderHash: 'abc123', didUpsert: true }

      deps.orders.ensure.mockResolvedValueOnce(expected)
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
