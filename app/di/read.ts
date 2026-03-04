import { orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { createReadPage } from '#app/views/read-page.js'
import { createReadById } from '#app/views/read-by-id.js'
import { Readers } from '#app/domain/shared/types/readers.js'

const readers: Readers = {
  order: orderRepo,
  settlement: settlementRepo,
  nftCollection: nftCollectionRepo,
}

// --- inject views ---
export const readById = createReadById(readers)
export const readPage = createReadPage(readers)

// --- inject workers
