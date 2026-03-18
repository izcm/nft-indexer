import { Status } from '../shared/status.js'
import type { Address } from '../shared/types/eth.js'
import type { WithTimestamps } from '../shared/types/with-timestamps.js'

export type NFTKey = {
  chainId: number
  collection: Address
  tokenId: string
}

export type NFTAttribute = {
  trait_type: string
  value: string
}

export type NFT = NFTKey &
  WithTimestamps & {
    tokenUri?: string
    name?: string
    description?: string
    image?: string
    attributes?: NFTAttribute[]

    metaStatus: Status
    metaError?: string

    createdAtBlock: number
  }
