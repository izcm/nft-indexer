import type { NFTCollectionPort } from './port.js'
import type { NFTCollectionKey, NFTCollectionMeta } from './model.js'

type Deps = {
  nftCollections: Pick<NFTCollectionPort, 'finalizeMeta'>
}

export const makeNFTCollectionActions = ({ nftCollections }: Deps) => {
  async function applyCollectionMeta(
    args: NFTCollectionKey & { meta: Partial<NFTCollectionMeta> }
  ) {
    await nftCollections.finalizeMeta(args)
  }

  return { applyCollectionMeta }
}
