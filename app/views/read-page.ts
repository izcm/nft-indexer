import type { FindPageArgs } from '#app/repos/shared/types.js'

import { applyDTOs } from './shared/apply-dtos.js'
import { hydratePage } from './shared/hydrate-page.js'
import type { includeFor } from './shared/include-rules.js'
import type { PagedResource } from './shared/resource-def.js'

export async function readPage<R extends PagedResource>(
  r: R,
  args: FindPageArgs,
  opts: { include?: includeFor<R>[] } = {}
) {
  const page = await hydratePage(r, args, opts)
  const toDTO = applyDTOs(r, page.items)

  return {
    items: toDTO,
    nextCursor: page.nextCursor,
  }
}
