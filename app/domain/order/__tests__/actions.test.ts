import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeOrderRecord } from '#tests/helpers/fixtures.js'

import { ingestOrder } from '../actions.js'
import { orderRepo } from '#app/repos/order.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { validOrder } from '../rules.js'

vi.mock('#app/repos/order.repo.js', () => ({
  orderRepo: {
    ensure: vi.fn(),
  },
  orderRepoFor: vi.fn(),
}))

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteNFTCollection: vi.fn(),
  },
}))

vi.mock('../rules.js', () => ({
  validOrder: vi.fn(),
}))

describe('domain actions - orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ingestOrder', () => {
    it('returns ensure result and notes collection', async () => {
      const orderRecord = fakeOrderRecord()
      const { chainId, order } = orderRecord

      const expected = { id: 'abc123', didUpsert: true }

      vi.mocked(orderRepo).ensure.mockResolvedValueOnce(expected as any)
      vi.mocked(validOrder).mockReturnValueOnce(true)
      vi.mocked(nftCollectionRepo).noteNFTCollection.mockResolvedValueOnce(undefined)

      const result = await ingestOrder(chainId, order)

      expect(orderRepo.ensure).toHaveBeenCalledExactlyOnceWith(chainId, order)
      expect(nftCollectionRepo.noteNFTCollection).toHaveBeenCalledExactlyOnceWith({
        chainId,
        address: order.collection,
      })
      expect(result).toEqual(expected)
    })
  })
})
