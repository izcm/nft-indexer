import { NFTCollection } from '#app/domain/nft-collection/model.js'

import { addrOf } from '#tests/helpers/evm-fixtures.js'

export function buildFakeNFTCollections(
  chainId: number,
  count: number,
  seed: string,
  overrides: Partial<NFTCollection> = {}
): NFTCollection[] {
  return Array.from({ length: count }).map((_, i) => ({
    chainId,
    address: addrOf(`collection:${i}:${seed}`),
    metaStatuss: 'PENDING',
    metaStatus: 'PENDING',
    backfillDone: false,
    updatedAt: i,
    createdAt: i,
    ...overrides,
  }))
}
