import 'dotenv/config'

const missing = ['MONGODB_URI', 'DB_NAME'].filter(k => !process.env[k])
if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`)

import './di/write.js'

// db
import { initDb } from './db/mongo.js'

// clients
import { chainClients, AppClient } from './clients.js'

// listsners
import { start as startListeners } from './listeners/index.js'

// api
import { start as startServer } from './api/index.js'

// workers
import { start as startWorkers } from './workers/index.js'

// di repos
import { nftCollectionRepo } from './repos/mongo/nft-collection.repo.js'
import { nftRepo } from './repos/mongo/nft.repo.js'
import { settlementRepo } from './repos/mongo/settlement.repo.js'

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

  // di

  const ports = {
    nftCollections: nftCollectionRepo,
    nfts: nftRepo,
    settlements: settlementRepo,
  }

  chainClients.forEach(chainClient => {
    logSection('Listeners')
    console.log('starting listeners...')
    startListeners(chainClient)

    logSection('Workers')
    console.log('starting background workers...')
    startWorkers(chainClient, ports)
  })
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
