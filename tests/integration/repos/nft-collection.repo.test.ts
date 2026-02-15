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
import { addrOf } from '#app/lib/utils/evm-primitives.js'
import { Status } from '#app/domain/enum.js'

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
const TEST_ADDR = addrOf('collection:default')

describe('nftCollectionRepo', () => {
  // === defaults ===

  const repo = nftCollectionRepo

  const makeParams = () => ({ chainId: 1, address: TEST_ADDR })

  // new instance per call
  const mockNFTCollection = () => ({
    chainId: TEST_CHAIN_ID,
    address: TEST_ADDR,
    metaStatus: Status.PENDING,
    chainMetaStatus: Status.PENDING,
    updatedAt: 0,
  })

  // === test repo read ===

  describe('read', () => {
    const {
      findById,
      findByNFTCollectionKey: findByChainIdAndAddress,
      findMissingChainMeta,
    } = nftCollectionRepo

    it('findById returns expected doc', async () => {
      const col = mockNFTCollection()

      const { insertedId } = await nftCollections().insertOne(col)

      const row = await findById(insertedId)
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row).toMatchObject(col)
    })

    it('findByChainIdAndAddress returns expected doc', async () => {
      const col = mockNFTCollection()

      await nftCollections().insertOne(col)

      const { chainId, address } = col

      const row = await findByChainIdAndAddress({ chainId, address })
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row).toMatchObject({
        chainId,
        address,
      })
    })

    it('findMissingChainMeta returns only collections with chainMetaStatus PENDING', async () => {
      const { chainId, address } = makeParams()

      // seed matching docs
      await seedCollections(chainId, 3, 'pending')

      // seed non-matching docs
      await seedCollections(chainId, 1, 'failed', { chainMetaStatus: Status.FAILED })
      await seedCollections(chainId, 1, 'done', { chainMetaStatus: Status.DONE })

      const rows = await findMissingChainMeta(TEST_CHAIN_ID, 100)

      expect(rows.length).toBe(3)
      expect(rows.every(r => r.chainMetaStatus === Status.PENDING)).toBe(true)
    })

    // === test repo write  ===

    describe('write', () => {
      describe('noteCollection', () => {
        it('creates collection doc for new chainId + address pair', async () => {
          const { chainId, address } = makeParams()

          vi.useFakeTimers()
          vi.setSystemTime(0)

          await repo.noteNFTCollection({ chainId, address })

          const rows = await nftCollections().find({}).toArray()

          expect(rows.length).toBe(1)

          const row = rows[0]
          expect(row._id).toBeInstanceOf(ObjectId)
          expect(row).toMatchObject({
            chainId,
            address,
            metaStatus: Status.PENDING,
            chainMetaStatus: Status.PENDING,
            updatedAt: 0,
          })
        })

        it('does not insert duplicate when chainId + address pair cached in memory', async () => {
          const { chainId, address } = makeParams()

          await repo.noteNFTCollection({ chainId, address })
          await repo.noteNFTCollection({ chainId, address })

          const rows = await nftCollections().find({}).toArray()

          expect(rows.length).toBe(1)
        })

        it('does not insert duplicate when cache is cleared', async () => {
          const { chainId, address } = makeParams()

          await repo.noteNFTCollection({ chainId, address })
          __resetSeenCollectionsForTest()
          await repo.noteNFTCollection({ chainId, address })

          const rows = await nftCollections().find({}).toArray()

          expect(rows.length).toBe(1)
        })
      })

      describe('meta / status writers', () => {
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

        it('finalizeChainMeta updates an nft-collection with chain meta and marks it DONE', async () => {
          const col = mockNFTCollection()

          await nftCollections().insertOne(col)

          const chainMeta: NFTCollectionChainMeta = {
            name: 'NAME',
            symbol: 'SYMBOL',
            tokenType: 'ERC721',
            totalSupply: '100',
          }

          const { chainId, address } = col
          vi.setSystemTime(writeTime)

          await repo.finalizeChainMeta({ chainId, address, chainMeta })

          const row = await nftCollections().findOne({ chainId, address })
          if (!row) throw new Error('row missing')

          expect(row).toMatchObject({
            ...chainMeta,
            chainMetaStatus: Status.DONE,
            updatedAt: writeTime,
          })
        })

        describe('markChainMetaFailed', () => {
          it('marks an existing nft-collection as FAILED + sets error', async () => {
            const col = mockNFTCollection()

            await nftCollections().insertOne(col)

            const error = 'error msg'

            const { chainId, address } = col
            vi.setSystemTime(writeTime)

            await repo.markChainMetaFailed({ chainId, address, error })

            const row = await nftCollections().findOne({ chainId, address })
            if (!row) throw new Error('row missing')

            expect(row).toMatchObject({
              chainMetaStatus: Status.FAILED,
              chainMetaError: error,
              updatedAt: writeTime,
            })
          })
        })

        it('patchMeta updates partial fields on an existing nft-collection', async () => {
          const col = mockNFTCollection()

          await nftCollections().insertOne({
            ...col,
            imageUrl: 'old-image',
            bannerImageUrl: 'old-banner',
            marketData: { floorPrice: 123 },
            socials: { twitterUsername: 'old-tw', externalUrl: 'old-url' },
          })

          const { chainId, address } = col
          vi.setSystemTime(writeTime)

          await repo.patchMeta({ chainId, address, patch: { imageUrl: 'new-image' } })

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
  })

  // === test repoFor wrapper ===

  describe('repoFor wrapper', () => {
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
})
