import type { Collection, Document as MongoDoc } from 'mongodb'

import { COLLECTIONS } from '#app/domain/constants/db.js'
import type { NFTCollection, NFTCollectionStats } from '#app/domain/nft-collection/types.js'
import type { OrderRecord } from '#app/domain/order/types.js'
import type { Settlement } from '#app/domain/settlement/types.js'

import { getDb } from './mongo.js'

export const orders = () => col<OrderRecord>(COLLECTIONS.ORDERS)

export const settlements = () => col<Settlement>(COLLECTIONS.SETTLEMENTS)

export const nftCollections = () => col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)

export const nftCollectionsStats = () => col<NFTCollectionStats>(COLLECTIONS.NFT_COLLECTION_STATS)

const col = <T extends MongoDoc>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}
