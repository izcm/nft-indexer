import { nftCollections, nftCollectionsStats, orders, settlements } from '../collections.js'

export const ensureIndexes = async () => {
  // === unique indexes ===

  await orders().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })
  await settlements().createIndex({ chainId: 1, orderHash: 1 }, { unique: true })

  await nftCollections().createIndex({ chainId: 1, address: 1 }, { unique: true })
  await nftCollectionsStats().createIndex({ chainId: 1, collection: 1, day: 1 }, { unique: true })

  // === other indexes ====

  // supports meta worker
  await settlements().createIndex({ chainId: 1, metaStatus: 1 })

  await orders().createIndex({ chainId: 1, 'order.collection': 1, status: 1 })

  // await orders().createIndex({ chainId: 1, 'order.collection': 1, status: 1, tokenIdSort: 1, _id: 1 })
}
