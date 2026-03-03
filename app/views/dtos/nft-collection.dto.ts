import type { NFTCollection } from '#app/domain/nft-collection/model.js'

export type NFTCollectionDTO = {
  chainId: number
  address: string
  imageUrl?: string
  bannerImageUrl?: string
  marketData?: {
    floorPrice?: number
  }
  socials?: {
    twitterUsername?: string
    externalUrl?: string
  }
  metaStatus: string
  metaError?: string
  chainMetaStatus: string
  chainMetaError?: string
  name?: string
  symbol?: string
  tokenType?: string
  totalSupply?: string
  updatedAt: number
}

export const nftCollectionDTO = {
  from(c: NFTCollection): NFTCollectionDTO {
    return {
      chainId: c.chainId,
      address: c.address,
      imageUrl: c.imageUrl,
      bannerImageUrl: c.bannerImageUrl,
      marketData: c.marketData,
      socials: c.socials,
      metaStatus: c.metaStatus,
      metaError: c.metaError,
      chainMetaStatus: c.chainMetaStatus,
      chainMetaError: c.chainMetaError,
      name: c.name,
      symbol: c.symbol,
      tokenType: c.tokenType,
      totalSupply: c.totalSupply,
      updatedAt: c.updatedAt,
    }
  },
}

export const toNFTCollectionDTO = nftCollectionDTO.from
