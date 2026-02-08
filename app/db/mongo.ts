import { MongoClient, Db, Collection, Document } from 'mongodb'

// db config
import { ensureIndexes } from './config/ensure-indexes.js'

// constants
import { COLLECTIONS } from '#app/domain/constants/db.js'

// domain types
import { OrderRecord } from '#app/domain/types/order.js'
import { Settlement } from '#app/domain/types/settlement.js'
import { NFTCollection } from '#app/domain/types/nft-collection.js'
import { NFTCollectionStats } from '#app/domain/types/nft-collection.js'

let db: Db | null = null

// === db getters ===

export const orders = () => col<OrderRecord>(COLLECTIONS.ORDERS)

export const settlements = () => col<Settlement>(COLLECTIONS.SETTLEMENTS)

export const nftCollections = () => col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)

export const nftCollectionsStats = () => col<NFTCollectionStats>(COLLECTIONS.NFT_COLLECTION_STATS)

const col = <T extends Document>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}

// === mongo drivers ===

export function getDb(): Db {
  if (!db) {
    throw new Error('DB not initialized')
  }
  return db
}

// === di ===

export function setDb(_db: Db) {
  db = _db
}

// === initializer ===

export async function initDb() {
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
