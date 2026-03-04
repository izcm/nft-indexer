import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import { pkOf, relations, WithIncludes, type includeFor } from '#app/domain/shared/relations.js'
import type {
  PagedResource,
  ResourceName,
  ResourceType,
} from '#app/domain/shared/types/resources.js'
import { PageableKeyReaders } from '#app/domain/shared/types/readers.js'

export async function hydratePage<R extends PagedResource>(
  readers: PageableKeyReaders,
  resource: R,
  args: DomainPageQuery<ResourceType<R>>,
  opts: { include?: includeFor<R>[] } = {}
) {
  // --- read page of base resource ---
  const page = await readers[resource].findPage(args)

  // --- include items ---
  for (const include of opts.include ?? []) {
    const buildFK = relations[resource][include] as (x: any) => any
    const pk = pkOf[include as ResourceName] as (x: any) => any

    // 1) collect foreign keys from base page
    const keys = page.items.map(item => buildFK(item))

    // 2) load related documents
    const related = await readers[include as ResourceName].findByKeys(keys)
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
      if (match) (item as any)[include] = match
    }
  }

  return page as {
    items: WithIncludes<R>[]
    nextCursor: string
  }
}
