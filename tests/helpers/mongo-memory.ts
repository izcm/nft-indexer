import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'

import { setDb } from '#app/db/mongo.js'

let mongod: MongoMemoryServer

let client: MongoClient
let db: Db

const startTestMongo = async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()

  client = new MongoClient(uri)
  await client.connect()

  db = client.db('test')
  setDb(db)
}
