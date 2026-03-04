import type { PagedResource, ResourceType } from '#app/domain/shared/types/resources.js'
import type { HttpPageRequest } from '#app/domain/shared/types/requests.js'
import type { includeFor } from '../domain/shared/relations.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'
import { PageableKeyReaders } from '#app/domain/shared/types/readers.js'

export const createReadPage = (readers: PageableKeyReaders) =>
  async function readPage<R extends PagedResource>(r: R, query: HttpPageRequest<ResourceType<R>>) {
    const { include, from, to, limit, cursor, ...filters } = query

    const page = await hydratePage(readers, r, query, {
      include: include as includeFor<R>[] | undefined,
    })

    const toDTO = applyDTOs(r, page.items)

    return {
      items: toDTO,
      nextCursor: page.nextCursor,
    }
  }
