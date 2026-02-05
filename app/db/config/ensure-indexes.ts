import { nftCollections, nftCollectionsStats, orders, orderStates, settlements } from '../mongo.js'

export const ensureIndexes = async () => {
  // === unique indexes ===

  await orders().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await orderStates().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await settlements().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })

  await nftCollections().createIndex({ chainId: 1, address: 1 }, { unique: true })
  await nftCollectionsStats().createIndex({ chainId: 1, address: 1, day: 1 }, { unique: true })

  // === other indexes ====

  // supports meta worker
  await settlements().createIndex({ chainId: 1, metaStatus: 1 })
  await orderStates().createIndex({ status: 1 })
}
