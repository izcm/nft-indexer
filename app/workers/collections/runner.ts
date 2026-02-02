import { AppClient } from '#app/chain/clients.js'

import { nftCollectionRepo as repo } from '#app/repos/nft-collection.repo.js'

// NFTCollections' metadata allow partial updates

export const runNFTCollectionWorker = async (client: AppClient) => {
  const chainId = client.chain.id

  {
    // chain meta
    const pending = await repo.findMissingChainMeta(25)
  }
}
