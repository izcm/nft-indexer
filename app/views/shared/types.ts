import { NFTCollection } from '#app/domain/nft-collection/types.js'
import { OrderRecord } from '#app/domain/order/types.js'
import { Settlement } from '#app/domain/settlement/types.js'

export type ResourceMap = {
  settlement: Settlement
  order: OrderRecord
  nftCollection: NFTCollection
}

export type ResourceName = keyof ResourceMap
export type ResourceType<R extends ResourceName> = ResourceMap[R]
