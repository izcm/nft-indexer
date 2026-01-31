import { COLLECTIONS } from '#app/domain/constants/db.js'
import { OrderState } from '#app/domain/types/order-state.js'
import { OrderRecord } from '#app/domain/types/order.js'
import { Settlement } from '#app/domain/types/settlement.js'
import { MongoClient, Db } from 'mongodb'

let db: Db | null = null

export const dbOrders = () => {
  const db = getDb()
  return db.collection<OrderRecord>(COLLECTIONS.ORDERS)
}

export const dbSettlements = () => {
  const db = getDb()
  return db.collection<Settlement>(COLLECTIONS.SETTLEMENTS)
}

export const dbOrderStates = () => {
  const db = getDb()
  return db.collection<OrderState>(COLLECTIONS.ORDER_STATES)
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
}

export const getDb = (): Db => {
  if (!db) {
    throw new Error('DB not initialized')
  }
  return db
}
