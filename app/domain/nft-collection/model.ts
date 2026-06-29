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

// metaStatus tracks status of the meta derived from contract calls

export type NFTCollectionBase = NFTCollectionKey &
  WithTimestamps & {
    // chain meta
    metaStatus: Status
    metaError?: string

    // backfill
    lastScannedBlock?: number
    backfillDone: boolean
  }

export type NFTCollectionMeta = {
  name: string
  symbol: string
  tokenType: string
  totalSupply: string
}

export type NFTCollection = NFTCollectionBase & Partial<NFTCollectionMeta>
