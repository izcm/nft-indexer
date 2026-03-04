import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type {
  NFTCollection,
  NFTCollectionChainMeta,
  NFTCollectionKey,
  NFTCollectionMetaPatch,
} from './model.js'

// todo: type return types
// note: dont depend on mongodb eg. make own updateresult type etc.

/* definitions nft-collection read / write  */

export interface NFTCollectionPort
  extends ByKey<NFTCollection, NFTCollectionKey>, Pageable<NFTCollection> {
  // ensure collection exists (no-op if already present)
  // - NB:  indexer calls this function pretty often so any repo should have some in-memory call
  //        to prevent repeated DB calls
  noteNFTCollection(key: NFTCollectionKey): Promise<void>

  // for workers appending chain data (symbol, name etc.)
  findMissingChainMeta(chainId: number, limit: number): Promise<NFTCollection[]>
  finalizeChainMeta({
    chainId,
    address,
    chainMeta,
  }: NFTCollectionKey & { chainMeta: Partial<NFTCollectionChainMeta> }): Promise<void>
  markChainMetaFailed({
    chainId,
    address,
    error,
  }: NFTCollectionKey & { error: string }): Promise<void>

  // patch off-chain meta (creator socials etc.)
  patchMeta({
    chainId,
    address,
    patch,
  }: NFTCollectionKey & { patch: NFTCollectionMetaPatch }): Promise<void>
}
