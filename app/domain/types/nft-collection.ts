import { Hex } from 'viem'

// metaStatus meaning:
// PENDING  -> no metadata fetched yet
// DONE     -> all intended metadata sources processed
// FAILED   -> ingestion failed irrecoverably

export type NFTCollectionBase = {
  chainId: number
  address: Hex
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
  chainMetaFetched: boolean // symbol, name, tokenType + potential totalSupply
  updatedAt: number
}

// incremental metadata eg. fetched across requests / partial updates
export type NFTCollectionMetaPatch = Partial<
  Omit<NFTCollectionBase, 'chainId' | 'address' | 'metaStatus' | 'baseMetaFetched' | 'updatedAt'>
>

export type NFTCollectionChainMeta = {
  name: string
  symbol: string
  tokenType: string
  totalSupply: string
}

export type NFTCollection = NFTCollectionBase & Partial<NFTCollectionChainMeta>
