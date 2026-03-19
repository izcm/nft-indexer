import { AppClient } from '#app/clients.js'
import { DEFAULT_WORKER_LIMIT } from '#app/domain/constants/limits.js'
import type { NFTPort } from '#app/domain/nft/port.js'

type MetaPort = {
  findPendingMeta: NFTPort['findPendingMeta']
}

export async function runNFTMetaWorker(client: AppClient, port: MetaPort) {
  const chainId = client.chain.id

  // get nfts with pending meta
  const pending = await port.findPendingMeta(chainId, DEFAULT_WORKER_LIMIT)

  for (const nft of pending) {
    // parse tokenuri
  }
}
