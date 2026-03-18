import { Status } from '../shared/status.js'
import { Address } from '../shared/types/eth.js'

export type NFTKey = {
  chainId: number
  address: Address
  tokenId: string
}

export type NFTAttribute = {
  trait_type: string
  value: string
}

export type NFT = {
  chainId: number
  collection: Address
  tokenId: string

  tokenUri?: string
  name?: string
  description?: string
  image?: string
  attributes?: NFTAttribute[]

  metaStatus: Status
  metaError?: string

  createdAtBlock: bigint
}
