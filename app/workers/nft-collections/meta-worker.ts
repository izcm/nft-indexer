import { DEFAULT_WORKER_LIMIT } from '#app/domain/constants/limits.js'

import type { AppClient } from '#app/clients.js'

import { readERC721Meta } from '#app/lib/blockchain/calls/erc721-meta.js'
import { isErc721 } from '#app/lib/blockchain/interfaces/erc165.js'

import { NFTCollectionPort, nftCollectionPortForChain } from '#app/domain/nft-collection/port.js'

export async function runNFTCollectionChainMetaWorker(client: AppClient, port: NFTCollectionPort) {
  const collections = nftCollectionPortForChain(port, client.chain.id)

  const pending = await collections.findMissingMeta(DEFAULT_WORKER_LIMIT)

  for (const collection of pending) {
    const { address } = collection

    const isSupported = await isErc721(client, address)

    if (!isSupported) {
      await collections.markMetaFailed(address, 'unsupported nft standard')
      continue
    }

    try {
      const chainMeta = await readERC721Meta(client, address)
      await collections.finalizeMeta(address, chainMeta)
    } catch (err) {
      await collections.markMetaFailed(
        address,
        err instanceof Error ? err.message : 'unknown error'
      )
    }
  }
}
