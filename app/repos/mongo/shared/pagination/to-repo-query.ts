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
  const baseQuery = buildMongoFilters(domainPageQuery.filters ?? {}, {
    from: domainPageQuery.from,
    to: domainPageQuery.to,
    rangeField: domainPageQuery.rangeField,
    fieldConfig,
  })

  return {
    dbCollection,
    sortField: String(domainPageQuery.sortField),
    sortDir: domainPageQuery.sortDir === 'asc' ? 1 : -1,
    cursor: domainPageQuery.cursor,
    limit: domainPageQuery.limit,
    baseQuery: baseQuery as Filter<TDoc>,
  }
}
