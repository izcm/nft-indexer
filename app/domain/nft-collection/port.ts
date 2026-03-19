import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import { Address } from '../shared/types/eth.js'
import type { NFTCollection, NFTCollectionMeta, NFTCollectionKey } from './model.js'

/**
 * NFTCollection read / write definitions.
 */

export interface NFTCollectionPort
  extends ByKey<NFTCollection, NFTCollectionKey>, Pageable<NFTCollection> {
  /**
   * Ensure collection exists (no-op if already present).
   *
   * NB: workers make calls here often, repos should implement
   * some in-memory cache to avoid repeated DB writes.
   */
  noteNFTCollection(key: NFTCollectionKey): Promise<void>

  /**
   * Find collections missing chain metadata (symbol, name, etc.).
   * Used by background workers.
   */
  findPendingMeta(chainId: number, limit: number): Promise<NFTCollection[]>

  /**
   * Backfill of nfts
   */
  findBackfillNotDone(chainId: number, limit: number): Promise<NFTCollection[]>

  /**
   * Finalize on-chain metadata after successful fetch.
   */
  finalizeMeta(args: NFTCollectionKey & { meta: Partial<NFTCollectionMeta> }): Promise<void>

  /**
   * Mark on-chain metadata fetch as failed.
   */
  markMetaFailed(args: NFTCollectionKey & { error: string }): Promise<void>

  /**
   * Update lastScannedBlock for a collection.
   */
  updateLastScannedBlock(args: NFTCollectionKey & { block: number }): Promise<void>
}

/**
 * WRAPPER
 * - Prettifies multichain code
 */

export const nftCollectionPortForChain = (port: NFTCollectionPort, chainId: number) => ({
  findMissingMeta(limit: number) {
    return port.findPendingMeta(chainId, limit)
  },

  finalizeMeta(address: Address, chainMeta: Partial<NFTCollectionMeta>) {
    return port.finalizeMeta({ chainId, address, meta: chainMeta })
  },

  markMetaFailed(address: Address, error: string) {
    return port.markMetaFailed({ chainId, address, error })
  },
})
