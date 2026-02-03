import { runSettlementWorker } from './settlements/runner.js'
import { AppClient } from '#app/chain/clients.js'
import { runNFTCollectionWorker } from './collections/runner.js'

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
    run: () => runNFTCollectionWorker(client),
  },
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const start = async (client: AppClient) => {
  const list = workers(client)

  const loop = async () => {
    for (const worker of list) {
      try {
        await worker.run()
      } catch (err) {
        const { id } = client.chain
        console.error(`[workers][${id}]: ${worker.name} crashed`, id, err)
      }
    }

    await sleep(10_000)
    loop()
  }

  loop()
}
