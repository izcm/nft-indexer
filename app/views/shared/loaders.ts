import type { NFTCollectionKey } from '#app/domain/nft-collection/model.js'
import type { OrderKey } from '#app/domain/order/model.js'
import type { SettlementKey } from '#app/domain/settlement/model.js'
import type { ResourceName } from '#app/domain/shared/types/resources.js'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'

export const loaders: {
  [K in ResourceName]: { findByKeys: (keys: any[]) => Promise<any[] | null> }
} = {
  settlement: {
    findByKeys: (keys: SettlementKey[]) => settlementRepo.findByKeys(keys),
  },
  order: {
    findByKeys: (keys: OrderKey[]) => orderRepo.findByKeys(keys),
  },
  nftCollection: {
    findByKeys: (keys: NFTCollectionKey[]) => nftCollectionRepo.findByKeys(keys),
  },
} as const
