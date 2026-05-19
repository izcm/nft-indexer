import type { PagedWithIncludesResource, ResourceName } from '#app/domain/shared/types/resource.js'
import type { Readers } from '#app/domain/shared/types/readers.js'
import type { PageRequest } from '#app/domain/shared/types/page.js'
import type { includeFor } from '../domain/shared/relations.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'

export const makeReadPage = (readers: Readers) =>
  async function readPage<R extends ResourceName>(
    // nftcollections 1:M relationship => don't do includes per today
    resource: R,
    query: PageRequest<R>
  ) {
    // non 1:1 relationships only support simple pagination
    // todo: would be nice to have include working for more relationship types
    if (resource === 'nftCollection' || resource === 'nft') {
      const page = await readers[resource].findPage(query)

      return {
        items: applyDTOs(resource, page.items),
        nextCursor: page.nextCursor,
      }
    }

    // resource 1:1 includes todo: add order toNFT / settlement toNFT
    const pagedResource = resource as PagedWithIncludesResource

    const page = await hydratePage(readers, pagedResource, query as any, {
      include: query.include as includeFor<PagedWithIncludesResource>[] | undefined,
    })

    return {
      items: applyDTOs(pagedResource, page.items),
      nextCursor: page.nextCursor,
    }
  }
