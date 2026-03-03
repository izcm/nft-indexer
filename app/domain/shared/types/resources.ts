import type { NFTCollection } from '#app/domain/nft-collection/types.js'
import type { OrderRecord } from '#app/domain/order/types.js'
import type { Settlement } from '#app/domain/settlement/types.js'

export const RESOURCE_NAMES = ['settlement', 'order', 'nftCollection'] as const
export type ResourceName = (typeof RESOURCE_NAMES)[number]

export type ResourceMap = {
  settlement: Settlement
  order: OrderRecord
  nftCollection: NFTCollection
}

export type ResourceType<R extends ResourceName> = ResourceMap[R]
export type PagedResource = Exclude<ResourceName, 'nftCollection'>
