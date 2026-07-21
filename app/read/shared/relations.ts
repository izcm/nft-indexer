import type { Settlement, SettlementKey } from '#app/domain/settlement/model.js'
import { settlementKeyOf } from '#app/domain/settlement/model.js'

import type { OrderRecord, OrderKey } from '#app/domain/order/model.js'
import { orderKeyOf } from '#app/domain/order/model.js'

import {
  nftCollectionKeyOf,
  type NFTCollection,
  type NFTCollectionKey,
} from '#app/domain/nft-collection/model.js'

import {
  RESOURCE_NAMES,
  type ResourceName,
  type ResourceType,
} from '#app/domain/shared/types/resource.js'

export type PagedWithIncludesResource = Exclude<ResourceName, 'nftCollection'>

import { nftKeyOf, type NFT, type NFTKey } from '#app/domain/nft/model.js'

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
    nft: (s: Settlement): NFTKey => ({
      chainId: s.chainId,
      collection: s.collection,
      tokenId: s.tokenId,
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
    nft: (o: OrderRecord): NFTKey => ({
      chainId: o.chainId,
      collection: o.order.collection,
      tokenId: o.order.tokenId,
    }),
  },
  nft: {
    nftCollection: (n: NFT): NFTCollectionKey => ({
      chainId: n.chainId,
      address: n.collection,
    }),
  },
} as const

export type WithIncludes<R extends ResourceName> = ResourceType<R> & {
  [K in Exclude<ResourceName, R>]?: ResourceType<K>
}

export type includeFor<R extends PagedWithIncludesResource> = keyof (typeof relations)[R]

export const ORDER_INCLUDES = RESOURCE_NAMES.filter(r => r !== 'order')
export const SETTLEMENT_INCLUDES = RESOURCE_NAMES.filter(r => r !== 'settlement')
