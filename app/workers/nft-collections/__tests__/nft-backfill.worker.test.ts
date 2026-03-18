import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findBackfillNotDone: vi.fn(),
  nftCollectionRepoFor: vi.fn(),
}))

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepoFor: mocks.nftCollectionRepoFor,
}))

// wire repo → method
mocks.nftCollectionRepoFor.mockImplementation(() => ({
  findBackfillNotDone: mocks.findBackfillNotDone,
}))

import { runNFTBackfillWorker } from '../nft-backfill.worker.js'

describe('runNFTBackfillWorker', () => {
  const getBlockNumber = vi.fn()
  const getLogs = vi.fn()

  const client = {
    chain: { id: 1 },
    getBlockNumber,
    getLogs,
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads pending collections and exits when there is nothing to backfill', async () => {
    mocks.findBackfillNotDone.mockResolvedValueOnce([])
    getBlockNumber.mockResolvedValueOnce(123n)

    await runNFTBackfillWorker(client)

    expect(mocks.nftCollectionRepoFor).toHaveBeenCalledExactlyOnceWith(1)
    expect(mocks.findBackfillNotDone).toHaveBeenCalledExactlyOnceWith()
    expect(getBlockNumber).toHaveBeenCalledExactlyOnceWith()
    expect(getLogs).not.toHaveBeenCalled()
  })

  it.skip('reads mint transfer logs for a pending collection', async () => {
    mocks.findBackfillNotDone.mockResolvedValueOnce([
      {
        address: '0x00000000000000000000000000000000000000aa',
        lastScannedBlock: 0,
      },
    ])
    getBlockNumber.mockResolvedValueOnce(10n)
    getLogs.mockResolvedValueOnce([])

    await runNFTBackfillWorker(client)

    expect(getLogs).toHaveBeenCalled()
  })
})
