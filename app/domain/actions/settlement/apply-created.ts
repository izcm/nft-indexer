import { nftCollectionStatsRepo as statsRepo } from '#app/repos/stats.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { Settlement } from '#app/domain/types/settlement.js'
import { applyOrderFilled } from '../order/apply-filled.js'

export async function applySettlementCreated(settlement: Settlement) {
  const { chainId, collection, orderHash, price, execution } = settlement
  const { timestamp } = execution.block

  const tag = 'settlement:created'

  void statsRepo
    .recordSettlement({ chainId, collection, timestamp, price })
    .catch(err => console.error(`[${tag}] recordSettlement failed`, err))

  void nftCollectionRepo
    .noteCollection(chainId, collection)
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))

  void applyOrderFilled(chainId, orderHash, timestamp).catch(err =>
    console.error(`[${tag}] applyOrderFilled failed`, err)
  )
}
