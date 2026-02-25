import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onSettlementCreated } from '../actions.js'
import { mockSettlement } from '#tests/mocks/primitives.js'

// --- mocks ---

const findByHash = vi.fn()
const markFilled = vi.fn()

vi.mock('#app/repos/order.repo.js', () => ({
  orderRepoFor: vi.fn(() => ({
    findByHash,
    markFilled,
  })),
}))

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteNFTCollection: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('domain actions - settlements', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  const genericError = new Error('db down')

  beforeEach(() => {
    vi.clearAllMocks()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // IMPORTANT: default behavior
    findByHash.mockResolvedValue(null)
  })

  const mock = mockSettlement()

  describe('onSettlementCreated', () => {
    it('logs if failed to note collection', async () => {
      const fn = vi.mocked(nftCollectionRepo).noteNFTCollection
      fn.mockRejectedValueOnce(genericError)

      const { chainId, orderHash, collection } = mock
      await onSettlementCreated({ chainId, orderHash, collection })

      expect(fn).toHaveBeenCalledExactlyOnceWith({
        chainId,
        address: collection,
      })

      expect(errorSpy).toHaveBeenCalledWith(
        `[settlement:created] failed to note NFT collection`,
        genericError
      )
    })

    it('marks order filled when order exists', async () => {
      findByHash.mockResolvedValueOnce({ hash: mock.orderHash })

      await onSettlementCreated(mock)

      expect(orderRepoFor).toHaveBeenCalledWith(mock.chainId)
      expect(findByHash).toHaveBeenCalledWith(mock.orderHash)
      expect(markFilled).toHaveBeenCalledWith(mock.orderHash)
    })

    it('does nothing if order not found', async () => {
      findByHash.mockResolvedValueOnce(null)

      await onSettlementCreated(mock)

      expect(findByHash).toHaveBeenCalledWith(mock.orderHash)
      expect(markFilled).not.toHaveBeenCalled()
    })

    it('logs if failed to mark order', async () => {
      findByHash.mockResolvedValueOnce({ hash: mock.orderHash })
      markFilled.mockRejectedValueOnce(genericError)

      await onSettlementCreated(mock)

      await vi.waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          `[settlement:created] failed to mark order as filled`,
          genericError
        )
      })
    })

    it('looks up order and marks it filled when order exists', async () => {
      findByHash.mockResolvedValueOnce({ hash: mock.orderHash })

      await onSettlementCreated(mock)

      // collection side-effect
      expect(nftCollectionRepo.noteNFTCollection).toHaveBeenCalledWith({
        chainId: mock.chainId,
        address: mock.collection,
      })

      // order lookup happens
      expect(findByHash).toHaveBeenCalledWith(mock.orderHash)

      // then it marks as filled
      expect(markFilled).toHaveBeenCalledWith(mock.orderHash)

      expect(errorSpy).not.toHaveBeenCalled()
    })
  })
})
