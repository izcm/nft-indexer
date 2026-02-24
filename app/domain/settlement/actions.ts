import { Hex } from 'viem'

import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { Settlement, SettlementMeta } from './types.js'
import { applyOrderFilled } from '../order/actions.js'
import { SettlementKey, settlementRepo, settlementRepoFor } from '#app/repos/settlement.repo.js'

export async function applySettlementObserved(settlement: Settlement) {
  try {
    await settlementRepo.save(settlement)

    const { chainId, orderHash, collection } = settlement
    void applySettlementCreated({ chainId, orderHash, collection })
  } catch (err) {
    throw new Error('[settlement:observed] save failed')
  }
}
export async function applySettlementCreated({
  chainId,
  orderHash,
  collection,
}: SettlementKey & { collection: Hex }) {
  const tag = 'settlement:created'

  void nftCollectionRepo
    .noteNFTCollection({ chainId, address: collection })
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))

  void applyOrderFilled(chainId, orderHash).catch(err =>
    console.error(`[${tag}] applyOrderFilled failed`, err)
  )
}

export async function applySettlementMeta({
  chainId,
  orderHash,
  meta,
}: SettlementKey & { meta: SettlementMeta }) {
  try {
    await settlementRepo.finalizeMeta({ chainId, orderHash, meta })
  } catch (err) {
    throw new Error('[settlement:meta] finalizeMeta failed', { cause: err })
  }
}
