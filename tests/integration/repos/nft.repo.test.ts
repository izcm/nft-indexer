import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest'
import { ObjectId } from 'mongodb'

import { nfts } from '#app/db/collections.js'
import type { NFT } from '#app/domain/nft/model.js'
import { Status } from '#app/domain/shared/status.js'

import { nftRepo } from '#app/repos/nft.repo.js'

// test helpers
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { addrOf } from '#tests/helpers/evm-fixtures.js'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await nfts().deleteMany()
})

describe('nftRepo', () => {
  const repo = nftRepo

  const CHAIN_ID = 1

  const fakeNFT = () => ({
    chainId: CHAIN_ID,
    collection: addrOf('test'),
    tokenId: '1',
    createdAtBlock: 1,
    metaStatus: Status.PENDING,
    ingestedAt: 0,
  })

  async function givenNFTDocExists(overrides: Partial<NFT> = {}) {
    const { insertedId } = await nfts().insertOne({
      ...fakeNFT(),
      ...overrides,
      _id: new ObjectId(),
      updatedAt: 0,
      createdAt: 0,
    })

    const nft = await nfts().findOne({ _id: insertedId })
    return { insertedId, nft }
  }

  describe('write', () => {
    describe('ensure', () => {
      it('inserts a new NFT doc and returns didUpsert: true', async () => {
        const key = { chainId: CHAIN_ID, collection: addrOf('test'), tokenId: '1' }

        const result = await repo.ensure(key, 100)

        expect(result.didUpsert).toBe(true)
        expect(result.key).toEqual(key)

        const doc = await nfts().findOne(key)
        expect(doc).toMatchObject({ ...key, createdAtBlock: 100, metaStatus: Status.PENDING })
      })

      it('does not upsert when doc already exists for the same key', async () => {
        const key = { chainId: CHAIN_ID, collection: addrOf('test'), tokenId: '1' }

        await repo.ensure(key, 100)
        const result = await repo.ensure(key, 200)

        expect(result.didUpsert).toBe(false)

        const count = await nfts().countDocuments(key)
        expect(count).toBe(1)
      })
    })
  })
})
