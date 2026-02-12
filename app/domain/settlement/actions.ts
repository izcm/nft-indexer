import { statsRepo } from '#app/repos/stats.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { Settlement, SettlementMeta } from './types.js'
import { applyOrderFilled } from '../order/actions.js'
import { settlementRepoFor } from '#app/repos/settlement.repo.js'

type SettlementCreatedInput = Pick<Settlement, 'chainId' | 'collection' | 'orderHash' | 'price'> & {
  timestamp: number
}

export async function applySettlementCreated({
  chainId,
  orderHash,
  collection,
  price,
  timestamp,
}: SettlementCreatedInput) {
  const tag = 'settlement:created'

  // void statsRepo
  //   .recordSettlement({ chainId, collection, timestamp, price })
  //   .catch(err => console.error(`[${tag}] recordSettlement failed`, err))

  void nftCollectionRepo
    .noteCollection(chainId, collection)
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))

  void applyOrderFilled(chainId, orderHash).catch(err =>
    console.error(`[${tag}] applyOrderFilled failed`, err)
  )
}

export async function applySettlementMeta(settlement: Settlement, meta: SettlementMeta) {
  const { chainId, orderHash, collection, price, execution } = settlement
  const { timestamp } = execution.block

  const repo = settlementRepoFor(chainId)

  try {
    await repo.finalizeMeta(orderHash, meta)
  } catch (err) {
    throw new Error('[settlement:meta] finalizeMeta failed', { cause: err })
  }
}
