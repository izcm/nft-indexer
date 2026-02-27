import { orderRepo, type OrderKey } from '#app/repos/order.repo.js'
import { settlementRepo, type SettlementKey } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo, type NFTCollectionKey } from '#app/repos/nft-collection.repo.js'
import type { FindPageArgs } from '#app/repos/shared/types.js'
import { findPageGeneric } from '#app/repos/shared/paginate.js'
import type { Settlement } from '#app/domain/settlement/types.js'
import type { OrderRecord } from '#app/domain/order/types.js'
import type { NFTCollection } from '#app/domain/nft-collection/types.js'

const loaders = {
  Settlement: {
    findByKey: (key: SettlementKey) => settlementRepo.findByKey(key),
  },
  Order: {
    findByKey: (key: OrderKey) => orderRepo.findByKey(key),
  },
  NFTCollection: {
    findByKey: (key: NFTCollectionKey) => nftCollectionRepo.findByKey(key),
  },
} as const

const includeKey = {
  Settlement: {
    Order: (s: Settlement): OrderKey => ({
      chainId: s.chainId,
      orderHash: s.orderHash,
    }),
    NFTCollection: (s: Settlement): NFTCollectionKey => ({
      chainId: s.chainId,
      address: s.collection,
    }),
  },
  Order: {
    Settlement: (o: OrderRecord): SettlementKey => ({
      chainId: o.chainId,
      orderHash: o.orderHash,
    }),
    NFTCollection: (o: OrderRecord): NFTCollectionKey => ({
      chainId: o.chainId,
      address: o.order.collection,
    }),
  },
}

type PagedResource = 'Settlement' | 'Order'
type includeFor<R extends PagedResource> = keyof (typeof includeKey)[R]

const findPageRoutes: Record<
  PagedResource,
  (args: FindPageArgs) => ReturnType<typeof findPageGeneric>
> = {
  Settlement: settlementRepo.findPage,
  Order: orderRepo.findPage,
}

export async function readGenericPage<R extends PagedResource>(
  resource: R,
  args: FindPageArgs,
  opts: { include?: includeFor<R>[] } = {}
) {
  const findPage = findPageRoutes[resource]

  type IncludeMaps = {
    [K in includeFor<R>]?: Map<string, any>
  }
  const includeMaps: IncludeMaps = {}

  const page = await findPage(args)

  for (const include of opts.include ?? []) {
    const builder = includeKey[resource][include] as (x: any) => any

    const map = new Map<string, any>()

    // now iterate over the page items
    for (const item of page.items) {
      const key = builder(item)

      const doc = await loaders[include as keyof typeof loaders].findByKey(key)
      if (!doc) continue

      const id = JSON.stringify(key)
      map.set(id, item)
    }

    includeMaps[include] = map
  }

  return {
    page,
    includeMaps,
  }
}
