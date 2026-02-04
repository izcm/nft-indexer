import { AppClient } from '#app/chain/clients.js'
import { DB_WORKER_LIMIT } from '#app/domain/constants/app.js'

import { nftCollectionRepoFor } from '#app/repos/nft-collections/collection.repo.js'

import { getCollectionMeta as getCollectionChainMeta } from '#app/chain/calls/collection-meta.js'

// NFTCollections' metadata allow partial updates

export const runNFTCollectionWorker = async (client: AppClient) => {
  const chainId = client.chain.id
  const repo = nftCollectionRepoFor(chainId)

  {
    // chain meta
    const pending = await repo.findMissingChainMeta(DB_WORKER_LIMIT)

    for (var collection of pending) {
      const { address } = collection

      try {
        const chainMeta = await getCollectionChainMeta(client, address)
        await repo.finalizeChainMeta(address, chainMeta)
      } catch (err) {
        await repo.markChainMetaFailed(
          address,
          err instanceof Error ? err.message : 'unknown error'
        )
      }
    }
  }
}
