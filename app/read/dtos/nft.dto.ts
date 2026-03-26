import type { NFT } from '#app/domain/nft/model.js'

export type NFTDTO = {
  id: string

  chainId: number
  collection: string
  tokenId: string

  tokenUri?: string
  name?: string
  description?: string
  image?: string
  attributes?: {
    trait_type: string
    value: string
  }[]

  createdAtBlock: number
}

export const nftDTO = {
  from(n: NFT): NFTDTO {
    return {
      id: `${n.chainId}:${n.collection}:${n.tokenId}`,

      chainId: n.chainId,
      collection: n.collection,
      tokenId: n.tokenId,

      tokenUri: n.tokenUri,
      name: n.name,
      description: n.description,
      image: n.image,
      attributes: n.attributes,

      createdAtBlock: n.createdAtBlock,
    }
  },
}

export const toNFTDTO = nftDTO.from
