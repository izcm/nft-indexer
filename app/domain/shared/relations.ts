import {
  settlementKeyOf,
  type Settlement,
  type SettlementKey,
} from '#app/domain/settlement/model.js'
import { type OrderRecord, type OrderKey, orderKeyOf } from '#app/domain/order/model.js'
import {
  nftCollectionKeyOf,
  type NFTCollection,
  type NFTCollectionKey,
} from '#app/domain/nft-collection/model.js'
import {
  RESOURCE_NAMES,
  type PagedResource,
  type ResourceMap,
  type ResourceName,
  type ResourceType,
} from '#app/domain/shared/types/resource.js'

export const pkOf = {
  settlement: (s: Settlement): SettlementKey => settlementKeyOf(s),
  order: (o: OrderRecord): OrderKey => orderKeyOf(o),
  nftCollection: (c: NFTCollection): NFTCollectionKey => nftCollectionKeyOf(c),
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

export type includeFor<R extends PagedResource> = keyof (typeof relations)[R]

export const ORDER_INCLUDES = RESOURCE_NAMES.filter(r => r !== 'order')
export const SETTLEMENT_INCLUDES = RESOURCE_NAMES.filter(r => r !== 'settlement')
