import type { PagedResource, ResourceType } from '#app/domain/shared/types/resources.js'
import { HttpPageRequest } from '#app/domain/shared/types/http.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'
import type { includeFor } from './shared/include-rules.js'

export async function readPage<R extends PagedResource>(
  r: R,
  query: HttpPageRequest<ResourceType<R>>
) {
  const { include, from, to, limit, cursor, ...filters } = query

  const page = await hydratePage(r, query, {
    include: include as includeFor<R>[] | undefined,
  })

  const toDTO = applyDTOs(r, page.items)

  return {
    items: toDTO,
    nextCursor: page.nextCursor,
  }
}
