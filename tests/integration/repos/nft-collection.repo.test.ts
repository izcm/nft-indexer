import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'

import { nftCollections } from '#app/db/collections.js'
import {
  __resetSeenCollectionsForTest,
  nftCollectionRepo,
  nftCollectionRepoFor,
} from '#app/repos/nft-collection.repo.js'

import { NFTCollectionChainMeta } from '#app/domain/nft-collection/types.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections } from '#tests/helpers/seed/seed-nft-collections.js'
import { addrOf } from '#tests/helpers/hash.js'
import { Status } from '#app/domain/shared.js'

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
      it('creates collection doc for new chainId + address pair', async () => {
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

      it('does not insert duplicate when chainId + address pair cached in memory', async () => {
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

      beforeAll(() => {
        vi.useFakeTimers()
      })

      beforeEach(() => {
        vi.setSystemTime(startTime)
      })

      afterAll(() => {
        vi.useRealTimers()
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

      it('patchMeta updates partial fields', async () => {
        await nftCollections().insertOne({
          ...baseDoc,
          imageUrl: 'old-image',
          bannerImageUrl: 'old-banner',
          marketData: { floorPrice: 123 },
          socials: { twitterUsername: 'old-tw', externalUrl: 'old-url' },
        })

        const { chainId, address } = baseDoc
        vi.setSystemTime(writeTime)

        await patchMeta(chainId, address, { imageUrl: 'new-image' })

        const row = await nftCollections().findOne({ chainId, address })
        if (!row) throw new Error('row missing')

        expect(row).toMatchObject({
          imageUrl: 'new-image',
          bannerImageUrl: 'old-banner',
          marketData: { floorPrice: 123 },
          socials: { twitterUsername: 'old-tw', externalUrl: 'old-url' },
          metaStatus: Status.PENDING,
          chainMetaStatus: Status.PENDING,
          updatedAt: writeTime,
        })
      })
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

    it('findMissingChainMeta returns only collections with chainMetaStatus PENDING', async () => {
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

  describe('repoFor wrapper', () => {
    const forChainId = TEST_CHAIN_ID
    const wrapper = nftCollectionRepoFor(forChainId)

    it('forwards to repo.findMissingChainMeta with expected params', async () => {
      const spy = vi.spyOn(nftCollectionRepo, 'findMissingChainMeta').mockResolvedValue([])

      await wrapper.findMissingChainMeta(10)

      expect(spy).toHaveBeenCalledExactlyOnceWith(forChainId, 10)
    })

    it('forwards to repo.finalizeChainMeta with expected params', async () => {
      const spy = vi.spyOn(nftCollectionRepo, 'finalizeChainMeta').mockResolvedValue({} as any)

      await wrapper.finalizeChainMeta(address, {})

      expect(spy).toHaveBeenCalledExactlyOnceWith(forChainId, address, {})
    })

    it('forwards to repo.markChainMetaFailed with expected params', async () => {
      const spy = vi.spyOn(nftCollectionRepo, 'markChainMetaFailed').mockResolvedValue({} as any)

      await wrapper.markChainMetaFailed(address, 'error')

      expect(spy).toHaveBeenCalledExactlyOnceWith(forChainId, address, 'error')
    })

    it('forwards to repo.patchMeta with expected params', async () => {
      const spy = vi.spyOn(nftCollectionRepo, 'patchMeta').mockResolvedValue({} as any)

      await wrapper.patchMeta(address, {})

      expect(spy).toHaveBeenCalledExactlyOnceWith(forChainId, address, {})
    })
  })
})
