import type { Collection, Filter, Document as MongoDoc } from 'mongodb'

import type { PageQuery } from '#app/domain/shared/types/page.js'

import type { GenericPageArgs } from './pagination/types.js'
import type { FieldConfig } from '../model/field-config.js'
import { buildMongoFilters } from './build-mongo-filters.js'

export function mapToRepoQuery<TDoc extends MongoDoc>(
  pageQuery: PageQuery,
  dbCollection: Collection<TDoc>,
  fieldConfig?: FieldConfig
): GenericPageArgs<TDoc> {
  const { from, to, rangeField, filters } = pageQuery
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

  const sortField = fieldConfig?.[pageQuery.sortField]?.dbField ?? pageQuery.sortField

  return {
    dbCollection,
    sortField,
    sortDir: pageQuery.sortDir === 'asc' ? 1 : -1,
    cursor: pageQuery.cursor,
    limit: pageQuery.limit,
    baseQuery: finalQuery as Filter<TDoc>,
  }
}
