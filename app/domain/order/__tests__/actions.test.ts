import { it, describe, vi, expect, beforeEach } from 'vitest'
import { mockOrderCore } from '#tests/mocks/primitives.js'

import { applyOrderCreated } from '../actions.js'
import { applyOrderFilled } from '../actions.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

const findByHash = vi.fn()
const markFilled = vi.fn()

vi.mock('#app/repos/order.repo.js', () => ({
  orderRepoFor: () => ({ findByHash, markFilled }),
}))

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteNFTCollection: vi.fn(),
  },
}))

const fmtError = (action: string, fnName: string) => `[order:${action}] ${fnName} failed`

// --------------- created ---------------

describe('applyOrderCreated', () => {
  it('logs if noteCollection fails', async () => {
    const err = new Error('db down')
    vi.mocked(nftCollectionRepo).noteNFTCollection.mockRejectedValueOnce(err)

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await applyOrderCreated(1, mockOrderCore())

    expect(spy).toHaveBeenCalledWith(fmtError('created', 'noteCollection'), err)
  })
})

// --------------- filled ---------------

describe('applyOrderFilled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if order missing', async () => {
    findByHash.mockResolvedValueOnce(null)

    await applyOrderFilled(1, '0xabc' as any)

    expect(markFilled).not.toHaveBeenCalled()
  })

  it('throws with tag if markFilled fails', async () => {
    findByHash.mockResolvedValueOnce({ hash: '0xabc' })
    markFilled.mockRejectedValueOnce(new Error('db down'))

    const expectedError = fmtError('filled', 'markFilled')

    await expect(applyOrderFilled(1, '0xabc')).rejects.toThrow(expectedError)
  })

  it('calls markFilled once when order exists', async () => {
    findByHash.mockResolvedValueOnce({ hash: '0xabc' })

    await applyOrderFilled(1, '0xabc')

    expect(markFilled).toHaveBeenCalledTimes(1)
    expect(markFilled).toHaveBeenCalledWith('0xabc')
  })
})
