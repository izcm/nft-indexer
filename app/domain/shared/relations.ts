import { settlementKeyOf, type Settlement, type SettlementKey } from '../settlement/model.js'

import { orderKeyOf, type OrderRecord, type OrderKey } from '../order/model.js'

import {
  nftCollectionKeyOf,
  type NFTCollection,
  type NFTCollectionKey,
} from '../nft-collection/model.js'

import {
  RESOURCE_NAMES,
  type PagedWithIncludesResource,
  type ResourceName,
  type ResourceType,
} from '../shared/types/resource.js'

import { nftKeyOf, type NFT, type NFTKey } from '../nft/model.js'

export const pkOf = {
  settlement: (s: Settlement): SettlementKey => settlementKeyOf(s),
  order: (o: OrderRecord): OrderKey => orderKeyOf(o),
  nftCollection: (c: NFTCollection): NFTCollectionKey => nftCollectionKeyOf(c),
  nft: (n: NFT): NFTKey => nftKeyOf(n),
} as const

export const relations = {
  settlement: {
    order: (s: Settlement): OrderKey => ({
      chainId: s.chainId,
      orderHash: s.orderHash,
    }),
    nftCollection: (s: Settlement): NFTCollectionKey => ({
      chainId: s.chainId,
      address: s.collection,
    }),
  },
  order: {
    settlement: (o: OrderRecord): SettlementKey => ({
      chainId: o.chainId,
      orderHash: o.orderHash,
    }),
    nftCollection: (o: OrderRecord): NFTCollectionKey => ({
      chainId: o.chainId,
      address: o.order.collection,
    }),
  },
} as const

export type AllExcept<R extends ResourceName> = Exclude<ResourceName, R>

export type WithIncludes<R extends ResourceName> = ResourceType<R> & {
  [K in Exclude<ResourceName, R>]?: ResourceType<K>
}

export type includeFor<R extends PagedWithIncludesResource> = keyof (typeof relations)[R]

export const ORDER_INCLUDES = RESOURCE_NAMES.filter(r => r !== 'order')
export const SETTLEMENT_INCLUDES = RESOURCE_NAMES.filter(r => r !== 'settlement')
