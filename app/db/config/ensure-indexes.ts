import { nftCollections, orders, settlements } from '../mongo.js'

export const ensureIndexes = async () => {
  await orders().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await settlements().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await nftCollections().createIndex({ chainId: 1, address: 1 }, { unique: true })
}
