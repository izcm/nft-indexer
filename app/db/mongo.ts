import { Db, MongoClient } from 'mongodb'

// db config
import { ensureIndexes } from './config/ensure-indexes.js'

let db: Db | null = null

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
  const DB_NAME = 'dmrkt'

  if (!MONGODB_URI || !DB_NAME) {
    throw new Error('Error reading db config from .env')
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  db = client.db(DB_NAME)

  await ensureIndexes()
}
