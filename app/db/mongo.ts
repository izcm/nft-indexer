import { MongoClient, Db } from 'mongodb'

// constants
import { COLLECTIONS } from '#app/domain/constants/db.js'

// domain types
import { OrderState } from '#app/domain/types/order-state.js'
import { OrderRecord } from '#app/domain/types/order.js'
import { Settlement } from '#app/domain/types/settlement.js'
import { NFTCollection } from '#app/domain/types/nft-collection.js'
import { ensureIndexes } from './config/ensure-indexes.js'

let db: Db | null = null

// === db getters ===

export const dbOrders = () => {
  const db = getDb()
  return db.collection<OrderRecord>(COLLECTIONS.ORDERS)
}

export const dbNFTCollections = () => {
  const db = getDb()
  return db.collection<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)
}

export const dbSettlements = () => {
  const db = getDb()
  return db.collection<Settlement>(COLLECTIONS.SETTLEMENTS)
}

export const dbOrderStates = () => {
  const db = getDb()
  return db.collection<OrderState>(COLLECTIONS.ORDER_STATES)
}

// === initializer ===

export const getDb = (): Db => {
  if (!db) {
    throw new Error('DB not initialized')
  }
  return db
}

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
