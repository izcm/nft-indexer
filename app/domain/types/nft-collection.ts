import { Hex } from 'viem'

// metaStatus meaning:
// PENDING  -> no metadata fetched yet
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
  metaStatus: 'DONE' | 'PENDING' | 'FAILED'
  baseMetaFetched: boolean // symbol, name + potential totalSupply + tokenType
  updatedAt: number
}

// incremental metadata eg. fetched across requests / partial updates
export type NFTCollectionMetaPatch = Partial<
  Omit<NFTCollection, 'chainId' | 'address' | 'metaStatus' | 'baseMetaFetched' | 'updatedAt'>
>
