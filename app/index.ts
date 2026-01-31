import 'dotenv/config'

// db
import { initDb } from './db/mongo.js'

// clients
import { anvilClient } from './rpc/clients.js'

// listsners
import { start as startListeners } from './listeners/index.js'

// api
import { start as startServer } from './api/index.js'

// workers
import { start as startWorkers } from './workers/index.js'

async function main() {
  console.log('---------------------------------')
  console.log('booting up d | mrkt indexer...')
  console.log('---------------------------------')

  console.log('initializing database connection...')
  await initDb()
  console.log('database connected ✔')

  console.log('starting API server...')
  await startServer()

  // rpc stuff

  const clients = [anvilClient]

  clients.forEach(client => {
    console.log('starting listeners...')
    startListeners(client)

    console.log('starting background workers...')
    startWorkers(client)
  })
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
