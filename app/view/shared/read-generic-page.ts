import { orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import type { FindPageArgs } from '#app/repos/shared/types.js'
import { findPageGeneric } from '#app/repos/shared/paginate.js'
import {
  settlementKeyOf,
  type Settlement,
  type SettlementKey,
} from '#app/domain/settlement/types.js'
import { type OrderRecord, type OrderKey, orderKeyOf } from '#app/domain/order/types.js'
import {
  nftCollectionKeyOf,
  type NFTCollection,
  type NFTCollectionKey,
} from '#app/domain/nft-collection/types.js'
import { ResourceName } from './types.js'

const loaders = {
  Settlement: {
    findByKeys: (keys: SettlementKey[]) => settlementRepo.findByKeys(keys),
  },
  Order: {
    findByKeys: (keys: OrderKey[]) => orderRepo.findByKeys(keys),
  },
  NFTCollection: {
    findByKeys: (keys: NFTCollectionKey[]) => nftCollectionRepo.findByKeys(keys),
  },
} as const

const pkOf = {
  Settlement: (s: Settlement): SettlementKey => settlementKeyOf(s),
  Order: (o: OrderRecord): OrderKey => orderKeyOf(o),
  NFTCollection: (c: NFTCollection): NFTCollectionKey => nftCollectionKeyOf(c),
} as const

const relations = {
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
} as const

type PagedResource = Exclude<ResourceName, 'NFTCollection'>
type includeFor<R extends PagedResource> = keyof (typeof relations)[R]

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
  // --- read page of base resource ---
  const findPage = findPageRoutes[resource]
  const page = await findPage(args)

  // --- include items ---
  for (const include of opts.include ?? []) {
    const buildFK = relations[resource][include] as (x: any) => any
    const loaderKey = include as keyof typeof loaders
    const pk = pkOf[include as keyof typeof pkOf] as (x: any) => any

    // 1) collect foreign keys from base page
    const keys = page.items.map(item => buildFK(item))

    // 2) load related documents
    const related = await loaders[loaderKey].findByKeys(keys)

    // 3) index include items by primary key
    const index = new Map<string, any>()
    for (const doc of related) {
      index.set(JSON.stringify(pk(doc)), doc)
    }

    // 4) attach to related page item
    for (const item of page.items) {
      const fk = buildFK(item)
      const match = index.get(JSON.stringify(fk))
      if (match) item[include as string] = match
    }
  }

  return {
    page,
  }
}
