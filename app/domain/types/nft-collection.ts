import { Hex } from 'viem'

// metaStatus meaning:
// PENDING  -> no metadata fetched yet
// PARTIAL  -> some metadata fetched
// DONE     -> all intended metadata sources processed
// FAILED   -> ingestion failed irrecoverably

export type NFTCollection = {
  chainId: number
  address: Hex
  name?: string
  symbol?: string
  totalSupply?: string
  tokenType?: string
  imageUrl?: string
  bannerImageUrl?: string
  marketData?: {
    floorPrice?: number
  }
  socials?: {
    twitterUsername?: string
    externalUrl?: string
  }
  metaStatus: 'PARTIAL' | 'DONE' | 'PENDING' | 'FAILED'
  updatedAt: number
}

// incremental metadata eg. fetched across requests / partial updates
export type NFTCollectionMetaPatch = Partial<
  Omit<NFTCollection, 'chainId' | 'address' | 'metaStatus' | 'updatedAt'>
>
