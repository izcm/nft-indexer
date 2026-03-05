import { orderRepo } from '#app/repos/order.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'

import { makeOrderActions } from '#app/domain/order/actions.js'
import { makeSettlementActions } from '#app/domain/settlement/actions.js'

// --- inject actions ---

export const orderActions = makeOrderActions({
  orders: orderRepo,
  nftCollections: nftCollectionRepo,
})

export const settlementActions = makeSettlementActions({
  settlements: settlementRepo,
  orders: orderRepo,
  nftCollections: nftCollectionRepo,
})
