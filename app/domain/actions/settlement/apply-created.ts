import { statsRepo } from '#app/repos/stats.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { Settlement } from '#app/domain/types/settlement.js'
import { applyOrderFilled } from '../order/apply-filled.js'
import { Hex } from 'viem'

const TAG = 'settlement:created'

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
