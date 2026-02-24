import { ensureIndexes } from '#app/db/config/ensure-indexes.js'
import { setDb } from '#app/db/mongo.js'
import { Db, MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

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
