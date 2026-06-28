import 'dotenv/config'

// expected to add more later so just leaving this here
const missing = ['MONGODB_URI'].filter(k => !process.env[k])
if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`)

import './di/write.js'

// db
import { initDb } from './db/mongo.js'

// clients
import { initChainClients } from './clients.js'

// listsners
import { start as startListeners } from './listeners/start.js'

// api
import { start as startServer } from './api/start.js'

// workers
import { start as startWorkers } from './workers/start.js'

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

  // di

  const ports = {
    nftCollections: nftCollectionRepo,
    nfts: nftRepo,
    settlements: settlementRepo,
  }

  // read and initialize clients

  let chainClients
  while (true) {
    try {
      chainClients = await initChainClients()
      break
    } catch (err) {
      console.error('[indexer] chain client init failed, retrying in 5s...', err)
      await new Promise(resolve => setTimeout(resolve, 5_000))
    }
  }

  // background workers + listeners

  chainClients.forEach(chainClient => {
    const { id, name } = chainClient.client.chain
    logSection('Listeners')
    console.log(`starting listeners for chain ${name} (${id})...`)
    startListeners(chainClient)

    logSection('Workers')
    console.log(`starting background workers for chain ${name} (${id})...`)
    const workerInterval = process.env.WORKER_INTERVAL_MS
      ? Number(process.env.WORKER_INTERVAL_MS)
      : undefined
    startWorkers(chainClient, ports, workerInterval)
  })

  logSection('d | mrkt indexer is up')
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
