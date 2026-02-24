import { Hex } from 'viem'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { applySettlementCreated } from '../actions.js'
import { applyOrderFilled } from '#app/domain/order/actions.js'

// --- mocks ---

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteNFTCollection: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('#app/domain/order/actions.ts', () => ({
  applyOrderFilled: vi.fn().mockResolvedValue(undefined),
}))

describe('settlement domain actions', () => {
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
    orderHash: '0xabc' as Hex,
    collection: '0xabc' as Hex,
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
      await applySettlementCreated({ chainId, orderHash, collection })

      expect(fn).toHaveBeenCalledExactlyOnceWith({
        chainId,
        address: collection,
      })
      expectLogged('noteCollection', genericError)
    })

    it('logs if applyOrderFilled fails', async () => {
      const fn = vi.mocked(applyOrderFilled)
      fn.mockRejectedValueOnce(genericError)

      await applySettlementCreated(mock)

      expect(fn).toHaveBeenCalledExactlyOnceWith(mock.chainId, mock.orderHash)
      expectLogged('applyOrderFilled', genericError)
    })

    it('calls dependencies with correct params on success', async () => {
      const { chainId, orderHash, collection } = mock

      await applySettlementCreated({ chainId, orderHash, collection })

      expect(nftCollectionRepo.noteNFTCollection).toHaveBeenCalledWith({
        chainId,
        address: collection,
      })
      expect(applyOrderFilled).toHaveBeenCalledWith(chainId, orderHash)
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })
})
