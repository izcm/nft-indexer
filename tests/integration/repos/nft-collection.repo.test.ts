import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hex } from 'viem'

import { nftCollections } from '#app/db/mongo.js'
import { __resetSeenCollectionsForTest, nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections } from '#tests/helpers/seed/seed-collections.js'
import { Status } from '#app/domain/constants/db.js'
import { addrOf } from '#tests/helpers/hash.js'

beforeAll(async () => {
  await startTestMongo()
})

afterAll(async () => {
  await stopTestMongo()
})

beforeEach(async () => {
  await nftCollections().deleteMany({})
  __resetSeenCollectionsForTest()
})

const TEST_CHAIN_ID = 1

describe('nftCollectionRepo', () => {
  // default values

  const chainId = TEST_CHAIN_ID
  const address = addrOf('collection:default')

  const baseDoc = {
    chainId,
    address,
    metaStatus: Status.PENDING,
    chainMetaStatus: Status.PENDING,
    updatedAt: 0,
  }

  // === test repo write  ===

  describe('noteCollection', () => {
    const { noteCollection } = nftCollectionRepo
    it('inserts new doc on first call', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(0)

      await noteCollection(chainId, address)

      const rows = await nftCollections().find({}).toArray()

      expect(rows.length).toBe(1)
      expect(rows[0]).toEqual({
        _id: expect.any(Object),
        chainId,
        address,
        metaStatus: Status.PENDING,
        chainMetaStatus: Status.PENDING,
        updatedAt: 0,
      })
    })

    it('does not insert duplicate when cached in memory', async () => {
      await noteCollection(chainId, address)
      await noteCollection(chainId, address)

      const rows = await nftCollections().find({}).toArray()

      expect(rows.length).toBe(1)
    })

    it('does not insert duplicate when cache is cleared', async () => {
      await noteCollection(chainId, address)
      __resetSeenCollectionsForTest()
      await noteCollection(chainId, address)

      const rows = await nftCollections().find({}).toArray()

      expect(rows.length).toBe(1)
    })
  })

  // === test repo read ===

  it('findMissingChainMeta returns docs where metaStatus = Status.PENDING', async () => {
    // seed matching docs
    await seedCollections(chainId, 3, 'pending')

    // seed non-matching docs
    await seedCollections(chainId, 1, 'failed', { chainMetaStatus: Status.FAILED })
    await seedCollections(chainId, 1, 'done', { chainMetaStatus: Status.DONE })

    const rows = await nftCollectionRepo.findMissingChainMeta(TEST_CHAIN_ID, 100)

    expect(rows.length).toBe(3)
    expect(rows.every(r => r.chainMetaStatus === Status.PENDING)).toBe(true)
  })

  it('findById returns correct doc', async () => {
    const { insertedId } = await nftCollections().insertOne(baseDoc)
    const result = await nftCollectionRepo.findBydId(insertedId)

    expect(result).toEqual({
      _id: expect.any(Object),
      ...baseDoc,
    })
  })

  // === test repoFor wrapper ===
})
