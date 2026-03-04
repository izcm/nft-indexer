import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import type { SettlementKey } from './model.js'
import { Settlement, SettlementCall } from './model.js'
import type { Address } from '../shared/types/eth.js'

const TAG = 'settlement'

// === PRIMARY ACTIONS ===

export async function ingestSettlement(settlement: Settlement) {
  await settlementRepo.save(settlement)

  const { chainId, orderHash, collection } = settlement
  void onSettlementCreated({ chainId, orderHash, collection })
}

export async function ingestSettlementMeta({
  chainId,
  orderHash,
  meta,
}: SettlementKey & { meta: SettlementCall }) {
  try {
    await settlementRepo.finalizeCallReconstruction({ chainId, orderHash, meta })

    // corresponding order for settlement is a 'nice to have'
    //  => fire and forget
    // orderRepo.ensure(chainId, )
  } catch (err) {
    throw new Error(`[${TAG}:meta] failed to finalize settlement metadata`, { cause: err })
  }
}

// === SECONDARY ACTIONS ===

export async function onSettlementCreated({
  chainId,
  orderHash,
  collection,
}: SettlementKey & { collection: Address }) {
  const tag = `${TAG}:created`

  const orderRepo = orderRepoFor(chainId)

  // note collection
  void nftCollectionRepo
    .noteNFTCollection({ chainId, address: collection })
    ?.catch(err => console.error(`[${tag}] failed to note NFT collection`, err))

  // mark order as filled
  void orderRepo
    .findByHash(orderHash)
    .then(order => {
      if (!order) return
      return orderRepo.markFilled(orderHash)
    })
    .catch(err => console.error(`[${tag}] failed to mark order as filled`, err))
}
