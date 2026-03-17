import type {
  PagedResource,
  ResourceName,
  ResourceType,
} from '#app/domain/shared/types/resource.js'
import type { Readers } from '#app/domain/shared/types/readers.js'
import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import type { includeFor } from '../domain/shared/relations.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'

export const makeReadPage = (readers: Readers) =>
  async function readPage<R extends ResourceName>(
    // nftcollections 1:M relationship => don't do includes per today
    resource: R,
    query: HttpPageRequest<ResourceType<R>, R>
  ) {
    if (resource === 'nftCollection') {
      const page = await readers.nftCollection.findPage(query)

      return {
        items: applyDTOs('nftCollection', page.items),
        nextCursor: page.nextCursor,
      }
    }

    // resource 1:1 includes
    const pagedResource = resource as PagedResource

    const page = await hydratePage(readers, pagedResource, query as any, {
      include: query.include as includeFor<PagedResource>[] | undefined,
    })

    return {
      items: applyDTOs(pagedResource, page.items),
      nextCursor: page.nextCursor,
    }
  }
