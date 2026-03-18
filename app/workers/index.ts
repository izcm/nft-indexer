import { AppClient } from '#app/clients.js'
import { runNFTCollectionChainMetaWorker } from './nft-collections/nft-collection-meta.worker.js'
import { runSettlementWorker } from './settlements/call-reconstruction.worker.js'

// ------------------
// WORKERS
// ------------------

type Worker = {
  name: string
  run: () => Promise<void>
}

const workers = (client: AppClient): Worker[] => [
  {
    name: 'settlement',
    run: () => runSettlementWorker(client),
  },
  {
    name: 'nft-collection',
    run: () => runNFTCollectionChainMetaWorker(client),
  },
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function start(client: AppClient) {
  const list = workers(client)

  while (true) {
    for (const worker of list) {
      try {
        await worker.run()
      } catch (err) {
        const { id } = client.chain
        console.error(`[workers][${id}]: ${worker.name} crashed`, id, err)
      }
    }

    await sleep(10_000)
  }
}
