import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { Collection, Document as MongoDoc } from 'mongodb'
import type { GenericPageArgs } from './types.js'

export function mapDomainToRepoQuery<TDoc extends MongoDoc>(
  domainPageQuery: DomainPageQuery<any>,
  dbCollection: Collection<TDoc>
): GenericPageArgs<TDoc> {
  const { filters = {}, from, to, rangeField } = domainPageQuery
  const baseQuery: Record<string, any> = { ...filters }

  const groups: Record<string, string[]> = {}

  // custom handle for nft attributes
  if (Array.isArray(baseQuery.attributes)) {
    const pairs = baseQuery.attributes
    delete baseQuery.attributes

    for (const { trait, value } of pairs) {
      if (!groups[trait]) groups[trait] = []
      groups[trait].push(value)
    }
  }

  const attrAnd = Object.entries(groups).map(([trait, vals]) => ({
    attributes: {
      $elemMatch: {
        trait_type: trait,
        value: vals.length > 1 ? { $in: vals } : vals[0],
      },
    },
  }))

  // if and / or / nor exist they must be nonempty array
  if (attrAnd.length) {
    baseQuery.$and = [...(baseQuery.$and ?? []), ...attrAnd]
  }

  if ((from || to) && rangeField) {
    const k = String(rangeField)
    baseQuery[k] = {}
    if (from) baseQuery[k].$gte = from
    if (to) baseQuery[k].$lte = to
  }

  return {
    dbCollection,
    sortField: String(domainPageQuery.sortField),
    sortDir: domainPageQuery.sortDir === 'asc' ? 1 : -1,
    cursor: domainPageQuery.cursor,
    limit: domainPageQuery.limit,
    baseQuery,
  }
}
