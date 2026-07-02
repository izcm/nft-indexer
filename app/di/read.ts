import { orderRepo } from '#app/repos/mongo/order.repo.js'
import { settlementRepo } from '#app/repos/mongo/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/mongo/nft-collection.repo.js'

import { makeReadPage } from '#app/read/read-page.js'
import { makeReadOne } from '#app/read/read-one.js'
import { Readers } from '#app/domain/shared/types/readers.js'
import { nftRepo } from '#app/repos/mongo/nft.repo.js'

import type { PageQuery } from '#app/domain/shared/types/page.js'

const readers: Readers = {
  order: orderRepo,
  settlement: settlementRepo,
  nftCollection: nftCollectionRepo,
  nft: nftRepo,
}

// --- inject read layer ---

export const readByKey = makeReadOne(readers)
export const readPage = makeReadPage(readers)

export const countOrders = (filters: PageQuery['filters']) => orderRepo.count({ filters })
export const countSettlements = (filters: PageQuery['filters']) => settlementRepo.count({ filters })
export const countUniqueWallets = (filters?: PageQuery['filters']) =>
  settlementRepo.countUniqueWallets(filters)
