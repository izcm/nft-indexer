import { Hex } from 'viem'
import { Status } from '../enum.js'

export type NFTCollectionStats = {
  chainId: number
  collection: Hex
  day: number // unix timestamp at 00:00 UTC
  volume: string // wei
  floorPrice: string
}

// metaStatus meaning:
// PENDING  -> no metadata fetched yet
// DONE     -> all intended metadata sources processed
// FAILED   -> ingestion failed irrecoverably

// chainMetaStatus tracks status of the meta derived from contract calls

export type NFTCollectionBase = {
  chainId: number
  address: Hex

  // BASE META
  imageUrl?: string
  bannerImageUrl?: string

  marketData?: {
    floorPrice?: number
  }

  socials?: {
    twitterUsername?: string
    externalUrl?: string
  }

  metaStatus: Status
  metaError?: string

  // CHAIN META
  chainMetaStatus: Status
  chainMetaError?: string

  // CTX
  updatedAt: number
}

// incremental metadata eg. fetched across requests / partial updates
export type NFTCollectionMetaPatch = Partial<
  Omit<
    NFTCollectionBase,
    'chainId' | 'address' | 'metaStatus' | 'chainMetaStatus' | 'chainMetaError' | 'updatedAt'
  >
>

export type NFTCollectionChainMeta = {
  name: string
  symbol: string
  tokenType: string
  totalSupply: string
}

export type NFTCollection = NFTCollectionBase & Partial<NFTCollectionChainMeta>
