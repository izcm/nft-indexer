import { OrderKey, orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo, type SettlementKey } from '#app/repos/settlement.repo.js'
import type { FindPageArgs } from '#app/repos/shared/types.js'
import { findPageGeneric } from '#app/repos/shared/paginate.js'
import type { Settlement } from '#app/domain/settlement/types.js'
import type { OrderRecord } from '#app/domain/order/types.js'
import type { NFTCollection } from '#app/domain/nft-collection/types.js'
import { nftCollectionRepo, type NFTCollectionKey } from '#app/repos/nft-collection.repo.js'

// type ResourceDef<TDoc, TKey> = {
//   getKey: (doc: TDoc) => TKey
//   findByKey: (key: TKey) => Promise<TDoc | null>
// }

// type Resources = {
//   Settlement: ResourceDef<Settlement, SettlementKey>
//   Order: ResourceDef<OrderRecord, OrderKey>
//   NFTCollection: ResourceDef<NFTCollection, NFTCollectionKey>
// }

const resources = {
  Settlement: {
    getKey: (s: Settlement) => ({
      chainId: s.chainId,
      orderHash: s.orderHash,
    }),
    findByKey: (key: SettlementKey) => settlementRepo.findByKey(key),
  },

  Order: {
    getKey: (o: OrderRecord) => ({
      chainId: o.chainId,
      orderHash: o.orderHash,
    }),
    findByKey: (key: OrderKey) => orderRepo.findByKey(key),
  },

  NFTCollection: {
    getKey: (c: NFTCollection) => ({
      chainId: c.chainId,
      address: c.address,
    }),
    findByKey: (key: NFTCollectionKey) => nftCollectionRepo.findByKey(key),
  },
} as const

type PagedResource = Exclude<keyof typeof resources, 'NFTCollection'>

const findPageRoutes: Record<
  PagedResource,
  (args: FindPageArgs) => ReturnType<typeof findPageGeneric>
> = {
  Settlement: settlementRepo.findPage,
  Order: orderRepo.findPage,
}

export async function readGenericPage(
  resource: PagedResource,
  args: FindPageArgs,
  opts: { include?: (keyof typeof resources)[] } = {}
) {
  const findPage = findPageRoutes[resource]

  const page = await findPage(args)
}
