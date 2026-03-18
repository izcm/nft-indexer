import type { Status } from '../shared/status.js'
import type { Address } from '../shared/types/eth.js'
import { WithTimestamps } from '../shared/types/with-timestamps.js'

export type NFTCollectionKey = {
  chainId: number
  address: Address
}

export const nftCollectionKeyOf = (collection: NFTCollectionBase): NFTCollectionKey => ({
  chainId: collection.chainId,
  address: collection.address,
})

// metaStatus meaning:
// PENDING  -> no metadata fetched yet
// DONE     -> all intended metadata sources processed
// FAILED   -> ingestion failed irrecoverably

// chainMetaStatus tracks status of the meta derived from contract calls

export type NFTCollectionBase = NFTCollectionKey &
  WithTimestamps & {
    // web2 meta
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

    // chain meta
    chainMetaStatus: Status
    chainMetaError?: string

    // backfill
    lastScannedBlock?: number
    backfillDone: boolean
  }

// incremental metadata eg. fetched across requests / partial updates
export type NFTCollectionMetaPatch = Partial<
  Omit<
    NFTCollectionBase,
    | 'chainId'
    | 'address'
    | 'metaStatus'
    | 'chainMetaStatus'
    | 'chainMetaError'
    | 'updatedAt'
    | 'createdAt'
  >
>

export type NFTCollectionChainMeta = {
  name: string
  symbol: string
  tokenType: string
  totalSupply: string
}

export type NFTCollection = NFTCollectionBase & Partial<NFTCollectionChainMeta>
