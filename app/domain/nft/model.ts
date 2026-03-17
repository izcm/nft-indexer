import { Address } from '../shared/types/eth.js'

type NFTAttribute = {
  trait_type: string
  value: string
}

export type NFTMetadata = {
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
}

export type NFT = NFTMetadata & {
  id: string
  chainId: number
  collection: Address
  tokenId: bigint
}
