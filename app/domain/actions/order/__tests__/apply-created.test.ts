import { it, describe, vi, expect } from 'vitest'
import { mockOrderCore } from '#tests/mocks/primitives.js'

import { applyOrderCreated } from '../apply-created.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

vi.mock('#app/repos/nft-collection.repo.js', () => ({
  nftCollectionRepo: {
    noteCollection: vi.fn(),
  },
}))

const { noteCollection } = vi.mocked(nftCollectionRepo)

const fmtError = (fnName: string) => `[order:created] ${fnName} failed`

describe('applyOrderCreated', () => {
  it('logs if noteCollection fails', async () => {
    const err = new Error('db down')

    noteCollection.mockRejectedValueOnce(err)

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await applyOrderCreated(1, mockOrderCore())

    expect(spy).toHaveBeenCalledWith(fmtError('noteCollection'), err)
  })
})
