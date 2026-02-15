import { Hex } from 'viem'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { processSettlement } from '../actions.js'
import { applyOrderFilled } from '#app/domain/order/actions.js'

// --- mocks ---

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteNFTCollection: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('#app/repos/stats.repo.js', () => ({
  statsRepo: {
    recordSettlement: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('#app/domain/order/actions.ts', () => ({
  applyOrderFilled: vi.fn().mockResolvedValue(undefined),
}))

describe('applySettlementCreated', () => {
  // --- shared ---

  beforeEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const genericError = new Error('db down')
  let errorSpy: ReturnType<typeof vi.spyOn>

  const inMock = {
    chainId: 1,
    orderHash: '0xabc' as Hex,
    collection: '0xabc' as Hex,
    price: '1',
    timestamp: 0,
  }

  const expectLogged = (fnName: string, err: Error) => {
    expect(errorSpy).toHaveBeenCalledWith(`[settlement:created] ${fnName} failed`, err)
  }

  it('logs if noteCollection fails', async () => {
    const fn = vi.mocked(nftCollectionRepo).noteNFTCollection
    fn.mockRejectedValueOnce(genericError)

    await processSettlement(inMock)

    expect(fn).toHaveBeenCalledExactlyOnceWith({
      chainId: inMock.chainId,
      address: inMock.collection,
    })
    expectLogged('noteCollection', genericError)
  })

  it('logs if applyOrderFilled fails', async () => {
    const fn = vi.mocked(applyOrderFilled)
    fn.mockRejectedValueOnce(genericError)

    await processSettlement(inMock)

    expect(fn).toHaveBeenCalledExactlyOnceWith(inMock.chainId, inMock.orderHash)
    expectLogged('applyOrderFilled', genericError)
  })

  it('calls dependencies with correct params on success', async () => {
    await processSettlement(inMock)

    expect(nftCollectionRepo.noteNFTCollection).toHaveBeenCalledWith({
      chainId: inMock.chainId,
      address: inMock.collection,
    })
    expect(applyOrderFilled).toHaveBeenCalledWith(inMock.chainId, inMock.orderHash)
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
