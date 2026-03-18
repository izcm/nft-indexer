import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import { Address } from '../shared/types/eth.js'
import type {
  NFTCollection,
  NFTCollectionChainMeta,
  NFTCollectionKey,
  NFTCollectionMetaPatch,
} from './model.js'

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
  findMissingChainMeta(chainId: number, limit: number): Promise<NFTCollection[]>

  /**
   * Backfill of nfts
   */
  findBackfillNotDone(chainId: number, limit: number): Promise<NFTCollection[]>

  /**
   * Finalize chain metadata after successful fetch.
   */
  finalizeChainMeta(
    args: NFTCollectionKey & { chainMeta: Partial<NFTCollectionChainMeta> }
  ): Promise<void>

  /**
   * Mark chain metadata fetch as failed.
   */
  markChainMetaFailed(args: NFTCollectionKey & { error: string }): Promise<void>

  /**
   * Patch off-chain metadata (e.g. creator socials).
   */
  patchMeta(args: NFTCollectionKey & { patch: NFTCollectionMetaPatch }): Promise<void>

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
  findMissingChainMeta(limit: number) {
    return port.findMissingChainMeta(chainId, limit)
  },

  finalizeChainMeta(address: Address, chainMeta: Partial<NFTCollectionChainMeta>) {
    return port.finalizeChainMeta({ chainId, address, chainMeta })
  },

  markChainMetaFailed(address: Address, error: string) {
    return port.markChainMetaFailed({ chainId, address, error })
  },

  patchMeta(address: Address, patch: NFTCollectionMetaPatch) {
    return port.patchMeta({ chainId, address, patch })
  },
})
