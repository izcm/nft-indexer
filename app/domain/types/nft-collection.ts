import { Hex } from 'viem'

// metaStatus meaning:
// PENDING  -> no metadata fetched yet
// DONE     -> all intended metadata sources processed
// FAILED   -> ingestion failed irrecoverably

// chainMetaStatus tracks status of the meta derived from contract calls

type statusOptions = 'DONE' | 'PENDING' | 'FAILED'

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

  metaStatus: statusOptions
  metaError?: string

  // CHAIN META
  chainMetaStatus: statusOptions
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
