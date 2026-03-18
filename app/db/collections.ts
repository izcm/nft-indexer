import type { Collection, Document as MongoDoc } from 'mongodb'

import { COLLECTIONS } from '#app/domain/constants/db.js'

import type { NFTCollection } from '#app/domain/nft-collection/model.js'
import type { OrderRecord } from '#app/domain/order/model.js'
import type { Settlement } from '#app/domain/settlement/model.js'
import type { NFT } from '#app/domain/nft/model.js'

import { getDb } from './mongo.js'

export const orders = () => col<OrderRecord>(COLLECTIONS.ORDERS)
export const settlements = () => col<Settlement>(COLLECTIONS.SETTLEMENTS)
export const nftCollections = () => col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)
export const nfts = () => col<NFT>(COLLECTIONS.NFTS)

const col = <T extends MongoDoc>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}
