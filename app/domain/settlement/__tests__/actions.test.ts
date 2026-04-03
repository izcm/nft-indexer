import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSettlementActions } from '../actions.js'
import { fakeOrderRecord, fakeSettlement } from '#tests/helpers/fixtures.js'

// --- mocks ---

const fakeDeps = () => ({
  settlements: {
    save: vi.fn(),
    finalizeCallReconstruction: vi.fn(),
  },
  orders: {
    findByKey: vi.fn().mockResolvedValue(null),
    markOrderFilled: vi.fn(),
  },
  nftCollections: {
    noteNFTCollection: vi.fn(),
  },
})

describe('domain actions - settlements', () => {
  let deps: ReturnType<typeof fakeDeps>
  let actions: ReturnType<typeof makeSettlementActions>

  let errorSpy: ReturnType<typeof vi.spyOn>
  const genericError = new Error('db down')

  beforeEach(() => {
    vi.clearAllMocks()

    deps = fakeDeps()
    actions = makeSettlementActions(deps)

    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('settlement ingestion', () => {
    it('logs when failed to note collection', async () => {
      const noteFn = deps.nftCollections.noteNFTCollection
      noteFn.mockRejectedValueOnce(genericError)

      await actions.ingestSettlement(fakeSettlement())

      expect(errorSpy).toHaveBeenCalledWith(
        `[settlement:created] failed to note NFT collection`,
        genericError
      )
    })

    it('marks order filled when order exists', async () => {
      const { orders } = deps

      const settlement = fakeSettlement()

      orders.findByKey.mockResolvedValueOnce(fakeOrderRecord()) // can be whatever (truthy)

      await actions.ingestSettlement(fakeSettlement())

      const orderKey = { chainId: settlement.chainId, orderHash: settlement.orderHash }

      expect(orders.findByKey).toHaveBeenCalledWith(orderKey)
      expect(orders.markOrderFilled).toHaveBeenCalledWith({
        ...orderKey,
        chainEvent: settlement.execution,
      })
    })

    it('does nothing if order not found', async () => {
      const { orders } = deps
      const settlement = fakeSettlement()

      // no order found
      deps.orders.findByKey.mockResolvedValueOnce(null)

      await actions.ingestSettlement(settlement)

      expect(orders.findByKey).toHaveBeenCalledWith({
        chainId: settlement.chainId,
        orderHash: settlement.orderHash,
      })
      expect(orders.markOrderFilled).not.toHaveBeenCalled()
    })

    it('logs if failed to mark order', async () => {
      deps.orders.findByKey.mockResolvedValueOnce(fakeOrderRecord())
      deps.orders.markOrderFilled.mockRejectedValueOnce(genericError)

      actions.ingestSettlement(fakeSettlement())

      await vi.waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          `[settlement:created] failed to mark order as filled`,
          genericError
        )
      })
    })
  })
})
