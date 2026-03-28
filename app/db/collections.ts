import type { Collection, Document as MongoDoc } from 'mongodb'

import { COLLECTIONS } from '#app/domain/constants/db.js'

import type { NFTCollection } from '#app/domain/nft-collection/model.js'
import type { NFT } from '#app/domain/nft/model.js'
import type { OrderDoc, SettlementDoc } from '#app/repos/mongo/docs.js'

import { getDb } from './mongo.js'

export const orders = () => col<OrderDoc>(COLLECTIONS.ORDERS)
export const settlements = () => col<SettlementDoc>(COLLECTIONS.SETTLEMENTS)
export const nftCollections = () => col<NFTCollection>(COLLECTIONS.NFT_COLLECTIONS)
export const nfts = () => col<NFT>(COLLECTIONS.NFTS)

const col = <T extends MongoDoc>(name: string): Collection<T> => {
  return getDb().collection<T>(name)
}
