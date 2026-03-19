import { orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { makeReadPage } from '#app/views/read-page.js'
import { makeReadOne } from '#app/views/read-one.js'
import { Readers } from '#app/domain/shared/types/readers.js'
import { nftRepo } from '#app/repos/nft.repo.js'

const readers: Readers = {
  order: orderRepo,
  settlement: settlementRepo,
  nftCollection: nftCollectionRepo,
  nft: nftRepo,
}

// --- inject views ---

export const readByKey = makeReadOne(readers)
export const readPage = makeReadPage(readers)
