export const COLLECTIONS = {
  ORDER_STATES: 'order-states',
  ORDERS: 'orders',
  SETTLEMENTS: 'settlements',
  NFT_COLLECTIONS: 'nft-collections',
  NFT_COLLECTION_STATS: 'nft-collections-stats',
} as const

export const Status = {
  DONE: 'DONE',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
} as const

export type Status = (typeof Status)[keyof typeof Status]
