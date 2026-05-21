import { ChainClient } from '#app/clients.js'

import type { NFTCollectionPort } from '#app/domain/nft-collection/port.js'
import type { NFTPort } from '#app/domain/nft/port.js'
import type { SettlementPort } from '#app/domain/settlement/port.js'

import { runNFTBackfillWorker } from './nft-collections/backfill.worker.js'
import { runNFTCollectionMetaWorker } from './nft-collections/meta.worker.js'
import { runNFTMetaWorker } from './nfts/meta.worker.js'
import { runSettlementCallReconstructionWorker } from './settlements/call-reconstruction.worker.js'

// ------------------
// WORKERS
// ------------------

type Ports = {
  nftCollections: NFTCollectionPort
  nfts: NFTPort
  settlements: SettlementPort
}

type Worker = {
  name: string
  run: () => Promise<void>
}

const workers = ({ client, marketplaceAddr }: ChainClient, ports: Ports): Worker[] => [
  {
    name: 'settlements',
    run: () => runSettlementCallReconstructionWorker(client, ports.settlements, marketplaceAddr),
  },
  {
    name: 'nft-collections',
    run: async () => {
      await Promise.all([
        runNFTCollectionMetaWorker(client, ports.nftCollections),
        runNFTBackfillWorker(client, {
          findBackfillNotDone: ports.nftCollections.findBackfillNotDone,
          updateLastScannedBlock: ports.nftCollections.updateLastScannedBlock,
          ensureNFT: ports.nfts.ensure,
        }),
      ])
    },
  },
  {
    name: 'nfts',
    run: () => runNFTMetaWorker(client, ports.nfts),
  },
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function start(chainClient: ChainClient, ports: Ports) {
  const list = workers(chainClient, ports)

  while (true) {
    for (const worker of list) {
      try {
        await worker.run()
      } catch (err) {
        const { id } = chainClient.client.chain
        console.error(`[workers][${id}]: ${worker.name} crashed`, id, err)
      }
    }

    await sleep(10_000)
  }
}
