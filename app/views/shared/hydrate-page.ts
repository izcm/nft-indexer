import { orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'
import { findPageGeneric } from '#app/repos/shared/pagination/find-page-generic.js'

import type { SettlementKey } from '#app/domain/settlement/types.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { OrderKey } from '#app/domain/order/types.js'
import type { NFTCollectionKey } from '#app/domain/nft-collection/types.js'

import type {
  PagedResource,
  ResourceName,
  ResourceType,
} from '../../domain/shared/types/resources.js'
import { pkOf, relations, WithIncludes, type includeFor } from './include-rules.js'

const loaders: {
  [K in ResourceName]: { findByKeys: (keys: any[]) => Promise<any[] | null> }
} = {
  settlement: {
    findByKeys: (keys: SettlementKey[]) => settlementRepo.findByKeys(keys),
  },
  order: {
    findByKeys: (keys: OrderKey[]) => orderRepo.findByKeys(keys),
  },
  nftCollection: {
    findByKeys: (keys: NFTCollectionKey[]) => nftCollectionRepo.findByKeys(keys),
  },
} as const

const findPageRoutes: {
  [R in PagedResource]: (
    args: DomainPageQuery<ResourceType<R>>
  ) => ReturnType<typeof findPageGeneric>
} = {
  settlement: settlementRepo.findPage,
  order: orderRepo.findPage,
} as const

export async function hydratePage<R extends PagedResource>(
  resource: R,
  args: DomainPageQuery<ResourceType<R>>,
  opts: { include?: includeFor<R>[] } = {}
) {
  // --- read page of base resource ---
  const page = await findPageRoutes[resource](args)

  // --- include items ---
  for (const include of opts.include ?? []) {
    const buildFK = relations[resource][include] as (x: any) => any
    const loaderKey = include as keyof typeof loaders
    const pk = pkOf[include as keyof typeof pkOf] as (x: any) => any

    // 1) collect foreign keys from base page
    const keys = page.items.map(item => buildFK(item))

    // 2) load related documents
    const related = await loaders[loaderKey].findByKeys(keys)
    if (!related) continue

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

  return page as {
    items: WithIncludes<R>[]
    nextCursor: string
  }
}
