import { dbNFTCollections, dbOrders, dbSettlements } from '../mongo.js'

export const ensureIndexes = async () => {
  await dbOrders().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await dbSettlements().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await dbNFTCollections().createIndex({ chainId: 1, address: 1 }, { unique: true })
}
