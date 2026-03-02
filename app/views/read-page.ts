import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import type { FindPageArgs } from '#app/repos/shared/types.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'
import type { includeFor } from './shared/include-rules.js'
import { PageQuery } from './shared/types/page-query.js'
import type { PagedResource } from './shared/types/resource-defs.js'

export async function readPage<R extends PagedResource>(r: R, query: PageQuery) {
  const { include, from, to, limit, cursor, ...filters } = query

  const pageArgs: FindPageArgs = {
    filters,
    from,
    to,
    cursor,
    sortField: 'createdAt',
    sortDir: -1,
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
