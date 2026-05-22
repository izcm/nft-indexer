import type { NFTPort } from './port.js'
import type { NFTKey, NFTMeta } from './model.js'

type Deps = {
  nfts: Pick<NFTPort, 'finalizeMeta' | 'projectNFT' | 'ensure'>
}

export const makeNFTActions = ({ nfts }: Deps) => {
  async function ingestNFT(key: NFTKey, createdAtBlock: number) {
    return nfts.ensure(key, createdAtBlock)
  }

  async function applyNFTMeta(args: NFTKey & { meta: NFTMeta }) {
    const { meta, ...key } = args
    await nfts.finalizeMeta({ ...key, meta })
    await nfts.projectNFT(key, meta)
  }

  return { applyNFTMeta, ingestNFT }
}
