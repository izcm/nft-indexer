import { mockOrderRecord } from '#tests/mocks/primitives.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onOrderFilled } from '../actions.js'
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

describe('domain actions - orders', () => {
  const mockOrder = mockOrderRecord()
  const orderCore = mockOrder.order

  // describe('applyOrderCreated', () => {
  //   it('logs if noteCollection fails', async () => {
  //     const err = new Error('db down')
  //     vi.mocked(nftCollectionRepo).noteNFTCollection.mockRejectedValueOnce(err)

  //     const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  //     await onOrderCreated({ chainId: 1, address: orderCore.collection })

  //     expect(spy).toHaveBeenCalledWith(fmtError('created', 'noteCollection'), err)
  //   })
  // })

  describe('applyOrderFilled', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('does nothing if order missing', async () => {
      findByHash.mockResolvedValueOnce(null)

      await onOrderFilled({ chainId: 1, orderHash: '0xabc' })

      expect(markFilled).not.toHaveBeenCalled()
    })

    it('throws with tag if markFilled fails', async () => {
      findByHash.mockResolvedValueOnce(mockOrder)
      markFilled.mockRejectedValueOnce(new Error('db down'))

      const expectedError = fmtError('filled', 'markFilled')

      await expect(onOrderFilled({ chainId: 1, orderHash: '0xabc' })).rejects.toThrow(expectedError)
    })

    it('calls markFilled once when order exists', async () => {
      findByHash.mockResolvedValueOnce(mockOrder)

      await onOrderFilled({ chainId: 1, orderHash: '0xabc' })

      expect(markFilled).toHaveBeenCalledTimes(1)
      expect(markFilled).toHaveBeenCalledWith('0xabc')
    })
  })
})
