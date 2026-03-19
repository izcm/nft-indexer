import type { NFTCollection } from '#app/domain/nft-collection/model.js'

export type NFTCollectionDTO = {
  id: string

  chainId: number
  address: string

  name?: string
  symbol?: string
  tokenType?: string
  totalSupply?: string

  marketData?: {
    floorPrice?: number
  }
}

export const nftCollectionDTO = {
  from(c: NFTCollection): NFTCollectionDTO {
    return {
      id: `${c.chainId}:${c.address}`,
      chainId: c.chainId,
      address: c.address,

      name: c.name,
      symbol: c.symbol,
      tokenType: c.tokenType,
      totalSupply: c.totalSupply,
    }
  },
}

export const toNFTCollectionDTO = nftCollectionDTO.from
