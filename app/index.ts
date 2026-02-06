import 'dotenv/config'

// db
import { initDb } from './db/mongo.js'

// clients
import { anvilClient, AppClient } from './clients.js'

// listsners
import { start as startListeners } from './listeners/index.js'

// api
import { start as startServer } from './api/index.js'

// workers
import { start as startWorkers } from './workers/index.js'

async function main() {
  const logSection = (title: string) => {
    const line = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    console.log(`\n${line}`)
    console.log(title)
    console.log(`${line}\n`)
  }

  logSection('Booting up d | mrkt indexer')

  // db + server

  logSection('Database')
  console.log('initializing database connection...')
  await initDb()
  console.log('database connected ✔')

  logSection('API Server')
  console.log('starting API server...')
  await startServer()

  // background workers + listeners

  const clients: AppClient[] = [anvilClient]

  clients.forEach(client => {
    logSection('Listeners')
    console.log('starting listeners...')
    startListeners(client)

    logSection('Workers')
    console.log('starting background workers...')
    startWorkers(client)
  })
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
