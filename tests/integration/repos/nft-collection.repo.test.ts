import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { nftCollections } from '#app/db/mongo.js'
import { __resetSeenCollectionsForTest, nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections } from '#tests/helpers/seed/seed-collections.js'
import { Status } from '#app/domain/constants/db.js'
import { addrOf } from '#tests/helpers/hash.js'
import { ObjectId } from 'mongodb'
import { NFTCollectionChainMeta } from '#app/domain/types/nft-collection.js'

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

  describe('write', () => {
    describe('noteCollection', () => {
      const { noteCollection } = nftCollectionRepo
      it('inserts new doc on first call', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(0)

        await noteCollection(chainId, address)

        const rows = await nftCollections().find({}).toArray()

        expect(rows.length).toBe(1)
        expect(rows[0]).toMatchObject({
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

    describe('meta / status writers', () => {
      const { finalizeChainMeta, markChainMetaFailed, patchMeta } = nftCollectionRepo

      const startTime = 0
      const writeTime = 100

      beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(startTime)
      })

      it('finalizeChainMeta sets status DONE + meta fields', async () => {
        await nftCollections().insertOne(baseDoc)

        const chainMeta: NFTCollectionChainMeta = {
          name: 'NAME',
          symbol: 'SYMBOL',
          tokenType: 'ERC721',
          totalSupply: '100',
        }

        const { chainId, address } = baseDoc
        vi.setSystemTime(writeTime)

        await finalizeChainMeta(chainId, address, chainMeta)

        const row = await nftCollections().findOne({ chainId, address })
        if (!row) throw new Error('row missing')

        expect(row).toMatchObject({
          ...chainMeta,
          chainMetaStatus: Status.DONE,
          updatedAt: writeTime,
        })
      })

      it('markChainMetaFailed sets FAILED + error', async () => {
        await nftCollections().insertOne(baseDoc)

        const err = 'error msg'

        const { chainId, address } = baseDoc
        vi.setSystemTime(writeTime)

        await markChainMetaFailed(chainId, address, err)

        const row = await nftCollections().findOne({ chainId, address })
        if (!row) throw new Error('row missing')

        expect(row).toMatchObject({
          chainMetaStatus: Status.FAILED,
          chainMetaError: err,
          updatedAt: writeTime,
        })
      })

      it('patchMeta updates partial fields', async () => {})
    })
  })

  // === test repo read ===

  describe('read', () => {
    const { findById, findByChainIdAndAddress, findMissingChainMeta } = nftCollectionRepo

    it('findById returns expected doc', async () => {
      const { insertedId } = await nftCollections().insertOne(baseDoc)

      const row = await findById(insertedId)
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row._id).toBeInstanceOf(ObjectId)
      expect(row).toMatchObject(baseDoc)
    })

    it('findByChainIdAndAddress returns expected doc', async () => {
      await nftCollections().insertOne(baseDoc)

      const { chainId, address } = baseDoc

      const row = await findByChainIdAndAddress(chainId, address)
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row).toMatchObject({
        chainId,
        address,
      })
    })

    it('findMissingChainMeta returns docs where metaStatus = Status.PENDING', async () => {
      // seed matching docs
      await seedCollections(chainId, 3, 'pending')

      // seed non-matching docs
      await seedCollections(chainId, 1, 'failed', { chainMetaStatus: Status.FAILED })
      await seedCollections(chainId, 1, 'done', { chainMetaStatus: Status.DONE })

      const rows = await findMissingChainMeta(TEST_CHAIN_ID, 100)

      expect(rows.length).toBe(3)
      expect(rows.every(r => r.chainMetaStatus === Status.PENDING)).toBe(true)
    })
  })

  // === test repoFor wrapper ===
})
