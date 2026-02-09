import { nftCollections } from '#app/db/collections.js'
import { NFTCollection } from '#app/domain/types/nft-collection.js'
import { addrOf } from '../hash.js'

export const seedCollections = async (
  chainId: number,
  count: number,
  seed: string,
  patch: Partial<NFTCollection> = {}
) => {
  const collections: NFTCollection[] = Array.from({ length: count }).map((_, i) => ({
    chainId,
    address: addrOf(`collection:${i}:${seed}`),
    metaStatus: 'PENDING',
    chainMetaStatus: 'PENDING',
    updatedAt: i,
    ...patch,
  }))

  return nftCollections().insertMany(collections)
}
