import type { NFTCollection, NFTCollectionKey } from '#app/domain/nft-collection/model.js'
import type { NFT, NFTKey } from '#app/domain/nft/model.js'
import type { OrderKey, OrderRecord } from '#app/domain/order/model.js'
import type { Settlement, SettlementKey } from '#app/domain/settlement/model.js'

export const RESOURCE_NAMES = ['settlement', 'order', 'nftCollection', 'nft'] as const
export type ResourceName = (typeof RESOURCE_NAMES)[number]

export type ResourceMap = {
  settlement: {
    type: Settlement
    key: SettlementKey
  }
  order: {
    type: OrderRecord
    key: OrderKey
  }
  nftCollection: {
    type: NFTCollection
    key: NFTCollectionKey
  }
  nft: {
    type: NFT
    key: NFTKey
  }
}

export type ResourceType<R extends ResourceName> = ResourceMap[R]['type']
export type ResourceKey<R extends ResourceName> = ResourceMap[R]['key']

export type PagedWithIncludesResource = Exclude<ResourceName, 'nftCollection' | 'nft'>
