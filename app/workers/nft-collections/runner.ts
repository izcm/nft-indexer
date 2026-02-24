import type { AppClient } from '#app/clients.js'
import { readERC721Meta } from '#app/lib/blockchain/calls/erc721-meta.js'
import { isErc721 } from '#app/lib/blockchain/interfaces/erc165.js'
import { DEFAULT_WORKER_LIMIT } from '#app/domain/constants/app.js'
import { nftCollectionRepoFor } from '#app/repos/nft-collection.repo.js'

export const runNFTCollectionWorker = async (client: AppClient) => {
  const chainId = client.chain.id
  const repo = nftCollectionRepoFor(chainId)

  {
    // === chain meta ===

    const pending = await repo.findMissingChainMeta(DEFAULT_WORKER_LIMIT)

    for (const collection of pending) {
      const { address } = collection

      const isSupported = await isErc721(client, address)

      if (!isSupported) {
        await repo.markChainMetaFailed(address, 'unsupported nft standard')
        continue
      }

      try {
        const chainMeta = await readERC721Meta(client, address)
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
