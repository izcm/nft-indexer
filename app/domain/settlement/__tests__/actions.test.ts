import { onOrderFilled } from '#app/domain/order/actions.js'
import { asAddress, asHash } from '#app/domain/shared/eth.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onSettlementCreated } from '../actions.js'

// --- mocks ---

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteNFTCollection: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('#app/domain/order/actions.ts', () => ({
  onOrderFilled: vi.fn().mockResolvedValue(undefined),
}))

describe('domain actions - settlements', () => {
  // --- shared ---

  beforeEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const genericError = new Error('db down')
  let errorSpy: ReturnType<typeof vi.spyOn>

  const mock = {
    chainId: 1,
    orderHash: asHash('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    collection: asAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    price: '1',
    timestamp: 0,
  }

  function expectSettlementLogged(action: string, fnName: string, err: Error) {
    expect(errorSpy).toHaveBeenCalledWith(`[settlement:${action}] ${fnName} failed`, err)
  }

  describe('applySettlementCreated', () => {
    const expectLogged = (fnName: string, err: Error) =>
      expectSettlementLogged('created', fnName, err)

    it('logs if noteCollection fails', async () => {
      const fn = vi.mocked(nftCollectionRepo).noteNFTCollection
      fn.mockRejectedValueOnce(genericError)

      const { chainId, orderHash, collection } = mock
      await onSettlementCreated({ chainId, orderHash, collection })

      expect(fn).toHaveBeenCalledExactlyOnceWith({
        chainId,
        address: collection,
      })
      expectLogged('noteCollection', genericError)
    })

    it('logs if applyOrderFilled fails', async () => {
      const fn = vi.mocked(onOrderFilled)
      fn.mockRejectedValueOnce(genericError)

      await onSettlementCreated(mock)

      expect(fn).toHaveBeenCalledExactlyOnceWith({
        chainId: mock.chainId,
        orderHash: mock.orderHash,
      })
      expectLogged('applyOrderFilled', genericError)
    })

    it('calls dependencies with correct params on success', async () => {
      const { chainId, orderHash, collection } = mock

      await onSettlementCreated({ chainId, orderHash, collection })

      expect(nftCollectionRepo.noteNFTCollection).toHaveBeenCalledWith({
        chainId,
        address: collection,
      })
      expect(onOrderFilled).toHaveBeenCalledWith({ chainId, orderHash })
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })
})
