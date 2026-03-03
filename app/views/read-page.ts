import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'
import type { includeFor } from './shared/include-rules.js'

import type {
  PagedResource,
  ResourceName,
  ResourceType,
} from '#app/domain/shared/types/resources.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'

export async function readPage<R extends PagedResource>(
  r: R,
  query: DomainPageQuery<ResourceType<R>> & { include: ResourceName[] }
) {
  const { include, from, to, limit, cursor, ...filters } = query

  const pageArgs: DomainPageQuery = {
    filters,
    from,
    to,
    cursor,
    sortField: 'createdAt',
    sortDir: 'desc',
    limit: limit ?? DEFAULT_PAGE_LIMIT,
  }

  const page = await hydratePage(r, pageArgs, {
    include: include as includeFor<R>[] | undefined,
  })

  const toDTO = applyDTOs(r, page.items)

  return {
    items: toDTO,
    nextCursor: page.nextCursor,
  }
}
