import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_WORKER_LIMIT } from '#app/config/workers.js'

const ingestNFT = vi.fn()
const isFullyMinted = vi.fn()
const isDNFT = vi.fn().mockResolvedValue(false)

let isDemo = false

vi.mock('#app/di/write.js', () => ({
  nftActions: { ingestNFT },
}))

vi.mock('#app/config/app.js', () => ({
  get IS_DEMO() {
    return isDemo
  },
  FORK_START_BLOCK: 0,
}))

vi.mock('#app/lib/blockchain/calls/dnft.js', () => ({
  isFullyMinted,
  isDNFT,
  DNFT_ABI: {},
}))

const { runNFTBackfillWorker } = await import('../backfill.worker.js')

describe('runNFTBackfillWorker', () => {
  const makeClient = () => {
    const getBlockNumber = vi.fn()
    const getLogs = vi.fn()
    const readContract = vi.fn().mockResolvedValue(false)

    const client = {
      chain: { id: 1 },
      getBlockNumber,
      getLogs,
      readContract,
    } as any

    return { client, getBlockNumber, getLogs, readContract }
  }

  const defaultCollectionKey = {
    chainId: 123n,
    address: '0x00000000000000000000000000000000000000aa',
  }
  const defaultPendingCollection = { ...defaultCollectionKey, lastScannedBlock: 0 }

  const makePort = () => ({
    findBackfillNotDone: vi.fn().mockResolvedValue([defaultPendingCollection]),
    updateLastScannedBlock: vi.fn(),
    markBackfillDone: vi.fn(),
    nftCount: vi.fn(),
  })

  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    isDemo = false
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('backfill for DNFT collections', () => {
    describe('when demo flag is turned ON', () => {
      it('logs and continues when collection is not fully minted', async () => {
        isDemo = true
        isFullyMinted.mockResolvedValueOnce(false)

        const { client, getBlockNumber } = makeClient()
        const port = makePort()

        getBlockNumber.mockResolvedValueOnce(10n)

        await runNFTBackfillWorker(client, port)

        expect(isFullyMinted).toHaveBeenCalledOnce()
        expect(isDNFT).not.toHaveBeenCalled()

        expect(logSpy).toHaveBeenCalled()
      })
    })

    it('logs and continues when persisted NFT count has reached MAX_SUPPLY', async () => {
      const { client, readContract, getBlockNumber, getLogs } = makeClient()
      readContract.mockResolvedValue(10n)
      getBlockNumber.mockResolvedValueOnce(10n)
      getLogs.mockResolvedValue([])

      const notDNFT = { address: '0xNotDNFT', lastScannedBlock: 0 }

      const port = makePort()
      port.findBackfillNotDone.mockResolvedValueOnce([
        defaultPendingCollection, // isDNFT == true
        notDNFT, // isDNFT == false
      ])
      port.nftCount.mockResolvedValueOnce(10)

      isDNFT.mockReturnValueOnce(true)

      await runNFTBackfillWorker(client, port)

      expect(logSpy).toHaveBeenCalledOnce()
      expect(port.markBackfillDone).toHaveBeenCalledWith(defaultCollectionKey)

      // expect no getLogs to be called for DNFT
      expect(client.getLogs).not.toHaveBeenCalledWith(
        expect.objectContaining(defaultPendingCollection)
      )

      // for the non dnft -> expect getLogs to have been called
      expect(client.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ address: notDNFT.address })
      )
    })
  })

  it('reads pending collections and exits when there is nothing to backfill', async () => {
    const { client, getBlockNumber, getLogs } = makeClient()
    const port = makePort()
    port.findBackfillNotDone.mockResolvedValueOnce([])
    getBlockNumber.mockResolvedValueOnce(123n)

    await runNFTBackfillWorker(client, port)

    expect(port.findBackfillNotDone).toHaveBeenCalledExactlyOnceWith(1, DEFAULT_WORKER_LIMIT)
    expect(getBlockNumber).toHaveBeenCalledExactlyOnceWith()
    expect(getLogs).not.toHaveBeenCalled()
  })

  it('calls getLogs for a pending collection and does not ingestNFT when no logs returned', async () => {
    const { client, getBlockNumber, getLogs } = makeClient()
    const port = makePort()

    getBlockNumber.mockResolvedValueOnce(10n)
    getLogs.mockResolvedValue([])

    await runNFTBackfillWorker(client, port)

    expect(getLogs).toHaveBeenCalled()
    expect(ingestNFT).not.toHaveBeenCalled()
  })
})
