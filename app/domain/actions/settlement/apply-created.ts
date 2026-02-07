import { nftCollectionStatsRepo as statsRepo } from '#app/repos/stats.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { Settlement } from '#app/domain/types/settlement.js'
import { applyOrderFilled } from '../order/apply-filled.js'

const TAG = 'settlement:created'

export async function applySettlementCreated(settlement: Settlement) {
  const { chainId, collection, orderHash, price, execution } = settlement
  const { timestamp } = execution.block

  void statsRepo
    .recordSettlement({ chainId, collection, timestamp, price })
    .catch(err => console.error(`[${TAG}] recordSettlement failed`, err))

  void nftCollectionRepo
    .noteCollection(chainId, collection)
    .catch(err => console.error(`[${TAG}] noteCollection failed`, err))

  void applyOrderFilled(chainId, orderHash).catch(err =>
    console.error(`[${TAG}] applyOrderFilled failed`, err)
  )
}
