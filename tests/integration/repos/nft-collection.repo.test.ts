import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NFTCollectionMeta } from '#app/domain/nft-collection/model.js'
import { Status } from '#app/domain/shared/status.js'

import { nftCollections } from '#app/db/collections.js'
import { __resetSeenCollectionsForTest, nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { addrOf } from '#tests/helpers/evm-fixtures.js'
import { startTestMongo, stopTestMongo } from '#tests/helpers/mongo-memory.js'
import { seedCollections } from '#tests/helpers/seed/seed-nft-collections.js'

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
  // === helpers ===

  const repo = nftCollectionRepo

  const makeParams = () => ({ chainId: 1, address: TEST_ADDR })

  // new instance per call
  const mockNFTCollection = () => ({
    chainId: TEST_CHAIN_ID,
    address: TEST_ADDR,
    metaStatus: Status.PENDING,
    backfillDone: false,
    updatedAt: 0,
    createdAt: 0,
  })

  /* ======================================
    repo read
  ====================================== */

  describe('read', () => {
    it('findByNFTCollectionKey returns expected doc', async () => {
      const col = mockNFTCollection()

      await nftCollections().insertOne(col)

      const { chainId, address } = col

      const row = await repo.findByKey({ chainId, address })
      if (!row) throw new Error('row missing')

      expect(row).toBeDefined()
      expect(row).toMatchObject({
        chainId,
        address,
      })
    })

    it('findMissingMeta returns only collections with metaStatus PENDING', async () => {
      const { chainId } = makeParams()

      // seed matching docs
      await seedCollections(chainId, 3, 'pending')

      // seed non-matching docs
      await seedCollections(chainId, 1, 'failed', { metaStatus: Status.FAILED })
      await seedCollections(chainId, 1, 'done', { metaStatus: Status.DONE })

      const rows = await repo.findPendingMeta(chainId, 100)

      expect(rows.length).toBe(3)
      expect(rows.every(r => r.metaStatus === Status.PENDING)).toBe(true)
    })

    it('findBackfillNotDone only returns collection where backfillDone is false and correct chainId', async () => {
      const { chainId } = makeParams()

      // seed matching docs
      await seedCollections(chainId, 3, 'target', { backfillDone: false })

      // seed non-matching docs
      const otherChainId = chainId + 1
      await seedCollections(otherChainId, 2, 'wrong_chain', { backfillDone: false })
      await seedCollections(otherChainId, 1, 'wrong_status', { backfillDone: true })

      const rows = await repo.findBackfillNotDone(chainId, 10)

      expect(rows.length).toBe(3)
      expect(rows.every(r => r.metaStatus === Status.PENDING && r.chainId === chainId)).toBe(true)
    })
  })

  /* ======================================
    repo write
  ====================================== */

  // === create / upsert ===

  describe('noteCollection', () => {
    it('creates collection doc for new chainId + address pair', async () => {
      const { chainId, address } = makeParams()

      vi.useFakeTimers()
      vi.setSystemTime(0)

      await repo.noteNFTCollection({ chainId, address })

      const rows = await nftCollections().find().toArray()

      expect(rows.length).toBe(1)

      const row = rows[0]
      expect(row._id).toBeInstanceOf(ObjectId)
      expect(row).toMatchObject({
        chainId,
        address,
        metaStatus: Status.PENDING,
        updatedAt: 0,
      })
    })

    it('does not insert duplicate when chainId + address pair cached in memory', async () => {
      const { chainId, address } = makeParams()

      await repo.noteNFTCollection({ chainId, address })
      await repo.noteNFTCollection({ chainId, address })

      const rows = await nftCollections().find().toArray()

      expect(rows.length).toBe(1)
    })

    it('does not insert duplicate when cache is cleared', async () => {
      const { chainId, address } = makeParams()

      await repo.noteNFTCollection({ chainId, address })
      __resetSeenCollectionsForTest()
      await repo.noteNFTCollection({ chainId, address })

      const rows = await nftCollections().find().toArray()

      expect(rows.length).toBe(1)
    })
  })

  // === update ===

  describe('updateLastScannedBlock', () => {
    it('sets lastScannedBlock on an existing collection', async () => {
      const col = mockNFTCollection()
      await nftCollections().insertOne(col)

      const { chainId, address } = col
      await repo.updateLastScannedBlock({ chainId, address, block: 9999 })

      const row = await nftCollections().findOne({ chainId, address })
      if (!row) throw new Error('row missing')

      expect(row.lastScannedBlock).toBe(9999)
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

    it('finalizeMeta updates an nft-collection with chain meta and marks it DONE', async () => {
      const col = mockNFTCollection()

      await nftCollections().insertOne(col)

      const meta: NFTCollectionMeta = {
        name: 'NAME',
        symbol: 'SYMBOL',
        tokenType: 'ERC721',
        totalSupply: '100',
      }

      const { chainId, address } = col
      vi.setSystemTime(writeTime)

      await repo.finalizeMeta({ chainId, address, meta: meta })

      const row = await nftCollections().findOne({ chainId, address })
      if (!row) throw new Error('row missing')

      expect(row).toMatchObject({
        ...meta,
        metaStatus: Status.DONE,
        updatedAt: writeTime,
      })
    })

    describe('markMetaFailed', () => {
      it('marks an existing nft-collection as FAILED + sets error', async () => {
        const col = mockNFTCollection()

        await nftCollections().insertOne(col)

        const error = 'error msg'

        const { chainId, address } = col
        vi.setSystemTime(writeTime)

        await repo.markMetaFailed({ chainId, address, error })

        const row = await nftCollections().findOne({ chainId, address })
        if (!row) throw new Error('row missing')

        expect(row).toMatchObject({
          metaStatus: Status.FAILED,
          metaError: error,
          updatedAt: writeTime,
        })
      })
    })
  })
})
