import { AppClient } from '#app/clients.js'
import { runNFTBackfillWorker } from './nft-collections/nft-backfill.worker.js'
import { runNFTCollectionChainMetaWorker } from './nft-collections/nft-collection-meta.worker.js'
import { runSettlementCalReconstructionWorker } from './settlements/call-reconstruction.worker.js'

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
    run: () => runSettlementCalReconstructionWorker(client),
  },
  {
    name: 'nft-collection',
    run: async () => {
      await Promise.all([runNFTCollectionChainMetaWorker(client), runNFTBackfillWorker(client)])
    },
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
