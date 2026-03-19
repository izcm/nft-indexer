import { Status } from '../shared/status.js'
import type { Address } from '../shared/types/eth.js'
import type { WithTimestamps } from '../shared/types/with-timestamps.js'

export type NFTKey = {
  chainId: number
  collection: Address
  tokenId: string
}

export const nftKeyOf = (nft: NFT): NFTKey => ({
  chainId: nft.chainId,
  collection: nft.collection,
  tokenId: nft.tokenId,
})

export type NFTMeta = {
  tokenUri?: string
  name?: string
  description?: string
  image?: string
  attributes?: NFTAttribute[]
}

export type NFTAttribute = {
  trait_type: string
  value: string
}

export type NFT = NFTKey &
  NFTMeta &
  WithTimestamps & {
    metaStatus: Status
    metaError?: string

    createdAtBlock: number
  }
