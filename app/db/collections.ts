import { Collection, Document } from 'mongodb'

import { COLLECTIONS } from '#app/domain/constants/db.js'

import { OrderRecord } from '#app/domain/types/order.js'
import { Settlement } from '#app/domain/types/settlement.js'
import { NFTCollection } from '#app/domain/types/nft-collection.js'
import { NFTCollectionStats } from '#app/domain/types/nft-collection.js'
import { getDb } from './mongo.js'

export const orders = () => col<OrderRecord>(COLLECTIONS.ORDERS)

export const settlements = () => col<Settlement>(COLLECTIONS.SETTLEMENTS)

export const nftCollections = () => col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)

export const nftCollectionsStats = () => col<NFTCollectionStats>(COLLECTIONS.NFT_COLLECTION_STATS)

const col = <T extends Document>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}
