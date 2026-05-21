import type { ResourceName } from '#app/domain/shared/types/resource.js'
import type { Readers } from '#app/domain/shared/types/readers.js'
import type { PageRequest } from '#app/domain/shared/types/page.js'

import type { includeFor, PagedWithIncludesResource } from './shared/relations.js'
import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'

export const makeReadPage = (readers: Readers) =>
  async function readPage<R extends ResourceName>(resource: R, query: PageRequest<R>) {
    // todo: nft is skipped because of unfinished config
    // it should be able to specify includes

    /// only 1:1 M:1 relationships – NFTCollection only has 1:M
    if (resource === 'nftCollection' || resource === 'nft') {
      const page = await readers[resource].findPage(query)

      return {
        items: applyDTOs(resource, page.items),
        nextCursor: page.nextCursor,
      }
    }

    const pagedResource = resource as PagedWithIncludesResource

    const page = await hydratePage(readers, pagedResource, query as any, {
      include: query.include as includeFor<PagedWithIncludesResource>[] | undefined,
    })

    return {
      items: applyDTOs(pagedResource, page.items),
      nextCursor: page.nextCursor,
    }
  }
