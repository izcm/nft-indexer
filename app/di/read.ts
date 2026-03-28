import { orderRepo } from '#app/repos/mongo/order.repo.js'
import { settlementRepo } from '#app/repos/mongo/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/mongo/nft-collection.repo.js'

import { makeReadPage } from '#app/read/read-page.js'
import { makeReadOne } from '#app/read/read-one.js'
import { Readers } from '#app/domain/shared/types/readers.js'
import { nftRepo } from '#app/repos/mongo/nft.repo.js'

const readers: Readers = {
  order: orderRepo,
  settlement: settlementRepo,
  nftCollection: nftCollectionRepo,
  nft: nftRepo,
}

// --- inject views ---

export const readByKey = makeReadOne(readers)
export const readPage = makeReadPage(readers)
