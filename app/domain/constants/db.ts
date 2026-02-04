import { NFTCollection } from '../types/nft-collection.js'
import { OrderState } from '../types/order-state.js'
import { OrderRecord } from '../types/order.js'
import { Settlement } from '../types/settlement.js'

export const COLLECTIONS = {
  ORDER_STATES: 'order-states',
  ORDERS: 'orders',
  SETTLEMENTS: 'settlements',
  NFT_COLLECTIONS: 'nft-collections',
  NFT_COLLECTION_STATS: 'nft-collections-stats',
} as const
