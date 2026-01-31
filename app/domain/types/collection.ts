import { Hex } from 'viem'

export type Collection = {
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
  metaError?: string
}
