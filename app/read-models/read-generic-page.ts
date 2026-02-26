import { OrderKey, orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo, type SettlementKey } from '#app/repos/settlement.repo.js'
import type { FindPageArgs } from '#app/repos/shared/types.js'
import { findPageGeneric } from '#app/repos/shared/paginate.js'
import type { Settlement } from '#app/domain/settlement/types.js'
import type { OrderRecord } from '#app/domain/order/types.js'
import type { NFTCollection } from '#app/domain/nft-collection/types.js'
import { nftCollectionRepo, type NFTCollectionKey } from '#app/repos/nft-collection.repo.js'

type KeyExtractors = {
  Settlement: (doc: Settlement) => SettlementKey
  Order: (doc: OrderRecord) => OrderKey
  NFTCollection: (doc: NFTCollection) => NFTCollectionKey
}

const keys: KeyExtractors = {
  Settlement: s => ({
    chainId: s.chainId,
    orderHash: s.orderHash,
  }),
  Order: o => ({
    chainId: o.chainId,
    orderHash: o.orderHash,
  }),
  NFTCollection: c => ({
    chainId: c.chainId,
    address: c.address,
  }),
}

type PagedResource = Exclude<keyof typeof keys, 'NFTCollection'>

const findPageRoutes: Record<
  PagedResource,
  (args: FindPageArgs) => ReturnType<typeof findPageGeneric>
> = {
  Settlement: settlementRepo.findPage,
  Order: orderRepo.findPage,
}

export async function readPage(
  key: PagedResource,
  args: FindPageArgs,
  opts: { includeCollection?: boolean } = {}
) {
  const findPage = findPageRoutes[key]

  const page = await findPage(args)
}

const inclution = {}
