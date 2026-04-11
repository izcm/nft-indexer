import type { Collection, Filter, Document as MongoDoc } from 'mongodb'

import type { DomainPageQuery } from '#app/domain/shared/types/page.js'

import type { GenericPageArgs } from './types.js'
import type { FieldConfig } from '../../field-config.js'
import { buildMongoFilters } from '../build-mongo-filters.js'

export function mapDomainToRepoQuery<TDoc extends MongoDoc>(
  domainPageQuery: DomainPageQuery,
  dbCollection: Collection<TDoc>,
  fieldConfig?: FieldConfig
): GenericPageArgs<TDoc> {
  const { from, to, rangeField, filters } = domainPageQuery
  const { or, ...and } = filters ?? {}

  const baseQuery = buildMongoFilters(and, {
    from,
    to,
    rangeField,
    fieldConfig,
  })

  let finalQuery: Record<string, unknown> = { ...baseQuery }

  // merge OR
  if (Array.isArray(or) && or.length) {
    // buildMongoFilters = "give me one AND object"
    // $or = "combinding multiple ANDs"
    // so we pass in each of the ANDs of OR seperately
    finalQuery.$or = or.map(cond => buildMongoFilters(cond, { fieldConfig }))
  }

  const sortField = fieldConfig?.[domainPageQuery.sortField]?.dbField ?? domainPageQuery.sortField

  return {
    dbCollection,
    sortField,
    sortDir: domainPageQuery.sortDir === 'asc' ? 1 : -1,
    cursor: domainPageQuery.cursor,
    limit: domainPageQuery.limit,
    baseQuery: finalQuery as Filter<TDoc>,
  }
}
