import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collections/collection.repo.js'

import { Settlement } from '#app/domain/types/settlement.js'
import { applyOrderFilled } from '../order/apply-filled.js'

export async function applySettlementCreated(settlement: Settlement) {
  const { chainId, collection, orderHash, price, execution } = settlement
  const { timestamp } = execution.block

  const tag = 'settlement:created'

  // independent projection
  void nftCollectionRepo
    .noteCollection(chainId, collection)
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))

  try {
    await applyOrderFilled(chainId, orderHash, timestamp, { waitForStats: true })
    await statsRepo.recordSettlement({ chainId, collection, timestamp, price })
  } catch (err) {
    console.error(`[${tag}] orderFilled failed -> skipp settlement stats`, err)
  }
}
