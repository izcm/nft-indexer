import { ChainClient } from '#app/clients.js'

import type { NFTCollectionPort } from '#app/domain/nft-collection/port.js'
import type { NFTPort } from '#app/domain/nft/port.js'
import type { SettlementPort } from '#app/domain/settlement/port.js'

import { runNFTBackfillWorker } from './poll/nft-collection/backfill.worker.js'
import { runNFTCollectionMetaWorker } from './enrich/nft-collection/meta.worker.js'
import { runNFTMetaWorker } from './enrich/nft/meta.worker.js'
import { runSettlementCallReconstructionWorker } from './enrich/settlement/call-reconstruction.worker.js'

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
    name: 'settlements/call-reconstruction',
    run: () => runSettlementCallReconstructionWorker(client, ports.settlements, marketplaceAddr),
  },

  {
    name: 'nft-collections/meta',
    run: () => runNFTCollectionMetaWorker(client, ports.nftCollections),
  },

  {
    name: 'nft-collections/backfill',
    run: () =>
      runNFTBackfillWorker(client, {
        findBackfillNotDone: ports.nftCollections.findBackfillNotDone,
        updateLastScannedBlock: ports.nftCollections.updateLastScannedBlock,
        markBackfillDone: ports.nftCollections.markBackfillDone,
        nftCount: ports.nfts.count,
      }),
  },

  {
    name: 'nfts/meta',
    run: () => runNFTMetaWorker(client, ports.nfts),
  },
]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function startWorker(worker: Worker, chainId: number, interval: number) {
  while (true) {
    try {
      await worker.run()
    } catch (err) {
      console.error(`[workers][${chainId}]: ${worker.name} crashed`, err)
    }

    await sleep(interval)
  }
}

export async function start(chainClient: ChainClient, ports: Ports, interval: number) {
  const list = workers(chainClient, ports)
  const { id } = chainClient.client.chain

  await Promise.all(list.map(worker => startWorker(worker, id, interval)))
}
