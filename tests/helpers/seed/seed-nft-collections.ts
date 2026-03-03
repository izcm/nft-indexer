import { nftCollections } from '#app/db/collections.js'
import { NFTCollection } from '#app/domain/nft-collection/model.js'
import { addrOf } from '#tests/helpers/evm-fixtures.js'

export const seedCollections = async (
  chainId: number,
  count: number,
  seed: string,
  overrides: Partial<NFTCollection> = {}
) => {
  const collections: NFTCollection[] = Array.from({ length: count }).map((_, i) => ({
    chainId,
    address: addrOf(`collection:${i}:${seed}`),
    metaStatus: 'PENDING',
    chainMetaStatus: 'PENDING',
    updatedAt: i,
    ...overrides,
  }))

  return nftCollections().insertMany(collections)
}
