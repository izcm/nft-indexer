import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { Collection, Document as MongoDoc } from 'mongodb'
import type { GenericPageArgs } from './types.js'

export function mapDomainToRepoQuery<TDoc extends MongoDoc>(
  domainPageQuery: DomainPageQuery<any>,
  dbCollection: Collection<TDoc>
): GenericPageArgs<TDoc> {
  const { filters = {}, from, to, rangeField } = domainPageQuery
  const baseQuery: Record<string, any> = {}

  const toMongo = (v: any) => {
    const arr = Array.isArray(v) ? v : [v]
    return arr.length === 1 ? arr[0] : { $in: arr }
  }

  for (const [k, v] of Object.entries(filters)) {
    if (k === 'attributes') continue // custom $elemMatch
    baseQuery[k] = toMongo(v)
  }

  const attrAnd = handleAttributes(filters)
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

function handleAttributes(filters: Record<string, any>) {
  const groups: Record<string, string[]> = {}

  // custom handle for nft attributes
  if (Array.isArray(filters.attributes)) {
    const pairs = filters.attributes

    for (const { trait, value } of pairs) {
      if (!groups[trait]) groups[trait] = []
      groups[trait].push(value)
    }
  }

  return Object.entries(groups).map(([trait, vals]) => ({
    attributes: {
      $elemMatch: {
        trait_type: trait,
        value: vals.length > 1 ? { $in: vals } : vals[0],
      },
    },
  }))
}
