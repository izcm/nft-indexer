import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'

import { setDb } from '#app/db/mongo.js'
import { ensureIndexes } from '#app/db/config/ensure-indexes.js'

let mongod: MongoMemoryServer

let client: MongoClient
let db: Db

export const startTestMongo = async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()

  client = new MongoClient(uri)
  await client.connect()

  db = client.db('test')
  setDb(db)

  await ensureIndexes()
}

export const stopTestMongo = async () => {
  await client.close()
  await mongod.stop()
}
