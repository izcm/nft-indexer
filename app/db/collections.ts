import type { Collection, Document as MongoDoc } from 'mongodb'

import type { NFTCollection } from '#app/domain/nft-collection/model.js'
import type { NFT } from '#app/domain/nft/model.js'
import type { OrderDoc, SettlementDoc } from '#app/repos/mongo/model/docs.js'

import { getDb } from './mongo.js'

const COLLECTIONS = {
  ORDER_STATES: 'order-states',
  ORDERS: 'orders',
  SETTLEMENTS: 'settlements',
  NFT_COLLECTIONS: 'nft-collections',
  NFTS: 'nfts',
} as const

export const orders = () => col<OrderDoc>(COLLECTIONS.ORDERS)
export const settlements = () => col<SettlementDoc>(COLLECTIONS.SETTLEMENTS)
export const nftCollections = () => col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)
export const nfts = () => col<NFT>(COLLECTIONS.NFTS)

const col = <T extends MongoDoc>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}
