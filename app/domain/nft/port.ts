import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { NFT, NFTKey, NFTMeta } from './model.js'

/**
 * NFT read / write definitions.
 */

export interface NFTPort extends ByKey<NFT, NFTKey>, Pageable<NFT> {
  /**
   * Ensures NFT exists in db
   * Prevents duplicate keys without throwing errors
   */
  ensure(key: NFTKey, createdAtBlock: number): Promise<{ key: NFTKey; didUpsert: boolean }>

  /**
   * Find nfts missing on-chain meta eg. for parsing attributes from tokenuri
   */
  findPendingMeta(chainId: number, limit: number): Promise<NFT[]>

  // todo: these two functions are shared between nft and nft colleciton port
  // can abstract into separate interface
  /**
   * Finalize on-chain metadata after successful fetch.
   */
  finalizeMeta(args: NFTKey & { meta: Partial<NFTMeta> }): Promise<void>

  /**
   * Mark on-chain metadata fetch as failed.
   */
  markMetaFailed(args: NFTKey & { error: string }): Promise<void>

  /**
   * Project on order & settlement docs to enable pagination filters on nft attributes. Kind of mongo specific.
   *  todo: maybe move out of domain
   */
  projectNFT(key: NFTKey, meta: NFTMeta): Promise<void>
}
