import { addrOf } from '#tests/helpers/evm-primitives.js'
import { nftCollectionRepo, nftCollectionRepoFor } from '#app/repos/nft-collection.repo.js'
import { describe, expect, it, vi } from 'vitest'

const TEST_CHAIN_ID = 1
const TEST_ADDR = addrOf('collection:default')

// === test repoFor wrapper ===

describe('nft-collection repoFor wrapper', () => {
  const forChainId = TEST_CHAIN_ID
  const wrapper = nftCollectionRepoFor(forChainId)

  it('findMissingChainMeta forwards expected params', async () => {
    const spy = vi.spyOn(nftCollectionRepo, 'findMissingChainMeta').mockResolvedValue([])

    await wrapper.findMissingChainMeta(10)

    expect(spy).toHaveBeenCalledExactlyOnceWith(forChainId, 10)
  })

  it('finalizeChainMeta forwards expected params', async () => {
    const spy = vi.spyOn(nftCollectionRepo, 'finalizeChainMeta').mockResolvedValue({} as any)

    await wrapper.finalizeChainMeta(TEST_ADDR, {})

    expect(spy).toHaveBeenCalledExactlyOnceWith({
      chainId: forChainId,
      address: TEST_ADDR,
      chainMeta: {},
    })
  })

  it('markChainMetaFailed forwards expected params', async () => {
    const spy = vi.spyOn(nftCollectionRepo, 'markChainMetaFailed').mockResolvedValue({} as any)

    await wrapper.markChainMetaFailed(TEST_ADDR, 'error')

    expect(spy).toHaveBeenCalledExactlyOnceWith({
      chainId: forChainId,
      address: TEST_ADDR,
      error: 'error',
    })
  })

  it('patchMeta forwards expected paramss', async () => {
    const spy = vi.spyOn(nftCollectionRepo, 'patchMeta').mockResolvedValue({} as any)

    await wrapper.patchMeta(TEST_ADDR, {})

    expect(spy).toHaveBeenCalledExactlyOnceWith({
      chainId: forChainId,
      address: TEST_ADDR,
      patch: {},
    })
  })
})
