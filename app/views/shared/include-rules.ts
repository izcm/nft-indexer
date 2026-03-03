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
} from '../../domain/shared/types/resources.js'

export const pkOf = {
  Settlement: (s: Settlement): SettlementKey => settlementKeyOf(s),
  Order: (o: OrderRecord): OrderKey => orderKeyOf(o),
  NFTCollection: (c: NFTCollection): NFTCollectionKey => nftCollectionKeyOf(c),
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
  _id: unknown
} & Partial<{
    [K in ResourceName]: ResourceMap[K] & { _id: unknown }
  }>

export type includeFor<R extends PagedResource> = keyof (typeof relations)[R]
