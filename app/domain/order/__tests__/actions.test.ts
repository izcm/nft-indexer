import { mockOrderRecord } from '#tests/mocks/primitives.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
