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
import type {
  PagedResource,
  ResourceMap,
  ResourceName,
  ResourceType,
} from '#app/domain/shared/types/resources.js'

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

export type WithIncludes<R extends ResourceName> = ResourceType<R> & {
  [K in ResourceName]?: ResourceType<K>
}
export type includeFor<R extends PagedResource> = keyof (typeof relations)[R]
