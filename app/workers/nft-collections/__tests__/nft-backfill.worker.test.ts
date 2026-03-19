import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runNFTBackfillWorker } from '../nft-backfill.worker.js'

describe('runNFTBackfillWorker', () => {
  const getBlockNumber = vi.fn()
  const getLogs = vi.fn()

  const client = {
    chain: { id: 1 },
    getBlockNumber,
    getLogs,
  } as any

  const makePort = () => ({
    findBackfillNotDone: vi.fn(),
    updateLastScannedBlock: vi.fn(),
    ensureNFT: vi.fn(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads pending collections and exits when there is nothing to backfill', async () => {
    const port = makePort()
    port.findBackfillNotDone.mockResolvedValueOnce([])
    getBlockNumber.mockResolvedValueOnce(123n)

    await runNFTBackfillWorker(client, port)

    expect(port.findBackfillNotDone).toHaveBeenCalledExactlyOnceWith(1, 25)
    expect(getBlockNumber).toHaveBeenCalledExactlyOnceWith()
    expect(getLogs).not.toHaveBeenCalled()
    expect(port.ensureNFT).not.toHaveBeenCalled()
  })

  it('calls getLogs for a pending collection and does not ensureNFT when no logs returned', async () => {
    const port = makePort()
    port.findBackfillNotDone.mockResolvedValueOnce([
      { address: '0x00000000000000000000000000000000000000aa', lastScannedBlock: 0 },
    ])
    getBlockNumber.mockResolvedValueOnce(10n)
    getLogs.mockResolvedValue([])

    await runNFTBackfillWorker(client, port)

    expect(getLogs).toHaveBeenCalled()
    expect(port.ensureNFT).not.toHaveBeenCalled()
  })
})
