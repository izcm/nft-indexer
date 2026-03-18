import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { NFT, NFTKey } from './model.js'

/**
 * NFT read / write definitions.
 */

export interface NFTPort extends ByKey<NFT, NFTKey> {
  /**
   * Ensures NFT exists
   * Prevents duplicate keys without throwing errors
   */
  ensure(nft: NFT): Promise<{ key: NFTKey; didUpsert: boolean }>

  /**
   * Find nfts missing on-chain meta eg. for parsing attributes from tokenuri
   */
  findMissingChainMeta(chainId: number, limit: number): Promise<NFT[]>
}
