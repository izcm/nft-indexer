import { MongoClient, Db, Collection, Document } from 'mongodb'

// db config
import { ensureIndexes } from './config/ensure-indexes.js'

// constants
import { COLLECTIONS } from '#app/domain/constants/db.js'

// domain types
import { OrderRecord } from '#app/domain/types/order.js'
import { Settlement } from '#app/domain/types/settlement.js'
import { NFTCollection } from '#app/domain/types/nft-collection.js'
import { nftCollectionStats } from '#app/domain/types/nft-collection.js'

let db: Db | null = null

// === mongo drivers ===

export const getDb = (): Db => {
  if (!db) {
    throw new Error('DB not initialized')
  }
  return db
}

// === db getters ===

export const orders = () => {
  return col<OrderRecord>(COLLECTIONS.ORDERS)
}

export const settlements = () => {
  return col<Settlement>(COLLECTIONS.SETTLEMENTS)
}

export const nftCollections = () => {
  return col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)
}

export const nftCollectionsStats = () => {
  return col<nftCollectionStats>(COLLECTIONS.NFT_COLLECTION_STATS)
}

const col = <T extends Document>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}

// === initializer ===

export const initDb = async () => {
  const MONGODB_URI = process.env.MONGODB_URI
  const DB_NAME = process.env.DB_NAME

  if (!MONGODB_URI || !DB_NAME) {
    throw new Error('Error reading db config from .env')
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  db = client.db(DB_NAME)

  await ensureIndexes()
}

// === di ===

export const setDb = (next: Db) => {
  db = next
}
