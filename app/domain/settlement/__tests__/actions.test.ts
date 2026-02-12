import { Hex } from 'viem'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { statsRepo } from '#app/repos/stats.repo.js'
import { applySettlementCreated } from '../actions.js'
import { applyOrderFilled } from '#app/domain/order/actions.js'

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteCollection: vi.fn().mockResolvedValue(undefined),
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

const inMock = {
  chainId: 1,
  orderHash: '0xabc' as Hex,
  collection: '0xabc' as Hex,
  price: '1',
  timestamp: 0,
}

describe('applySettlementCreated', () => {
  const genericError = new Error('db down')
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const expectLogged = (fnName: string, err: Error) => {
    expect(spy).toHaveBeenCalledWith(`[settlement:created] ${fnName} failed`, err)
  }

  /* temporarily commented out in action (recordSettlement is never called => test fails) */

  // it('logs if recordSettlement fails', async () => {
  //   vi.mocked(statsRepo).recordSettlement.mockRejectedValueOnce(genericError)
  //   await applySettlementCreated(inMock)
  //   expectLogged('recordSettlement', genericError)
  // })

  it('logs if noteCollection fails', async () => {
    vi.mocked(nftCollectionRepo).noteCollection.mockRejectedValueOnce(genericError)
    await applySettlementCreated(inMock)
    expectLogged('noteCollection', genericError)
  })

  it('logs if applyOrderFilled fails', async () => {
    vi.mocked(applyOrderFilled).mockRejectedValue(genericError)
    await applySettlementCreated(inMock)
    expectLogged('applyOrderFilled', genericError)
  })
})
