import { NFTCollection } from '#app/domain/types/nft-collection.js'
import { addrOf } from '../hash.js'

export const seedCollections = (chainId: number) => {
  const docs: NFTCollection[] = Array.from({ length: 3 }).map((_, i) => ({
    chainId,
    address: addrOf(`collection:${i}`),
    metaStatus: 'PENDING',
    chainMetaStatus: 'PENDING',
    updatedAt: i,
  }))
}
