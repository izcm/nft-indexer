import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { SettlementKey, settlementRepo } from '#app/repos/settlement.repo.js'
import { onOrderFilled } from '../order/actions.js'
import type { Address } from '../shared/eth.js'
import { Settlement, SettlementMeta } from './types.js'
const TAG = 'settlement'

// === SETTLEMENT CORE ===

export async function ingestSettlement(settlement: Settlement) {
  await settlementRepo.save(settlement)

  const { chainId, orderHash, collection } = settlement
  void onSettlementCreated({ chainId, orderHash, collection })
}

export async function onSettlementCreated({
  chainId,
  orderHash,
  collection,
}: SettlementKey & { collection: Address }) {
  const tag = `${TAG}:created`

  void nftCollectionRepo
    .noteNFTCollection({ chainId, address: collection })
    .catch(err => console.error(`[${tag}] noteCollection failed`, err))

  void onOrderFilled({ chainId, orderHash }).catch(err =>
    console.error(`[${tag}] applyOrderFilled failed`, err)
  )
}

// === SETTLEMENT META ===

export async function ingestSettlementMeta({
  chainId,
  orderHash,
  meta,
}: SettlementKey & { meta: SettlementMeta }) {
  try {
    await settlementRepo.finalizeMeta({ chainId, orderHash, meta })
  } catch (err) {
    throw new Error(`[${TAG}:meta] finalizeMeta failed`, { cause: err })
  }
}
