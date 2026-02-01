import { AppClient } from '#app/chain/clients.js'

import { nftCollectionRepo as repo } from '#app/repos/nft-collection.repo.js'

// NFTCollections' metadata allow partial updates

export const runNFTCollectionWorker = async (client: AppClient) => {
  const missingBaseMeta = await repo.findMissingBaseMeta(25)
  // const pending = await
}
