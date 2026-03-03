import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { Collection, Document as MongoDoc } from 'mongodb'
import type { GenericPageArgs } from './types.js'

export function mapDomainToRepoQuery<TDoc extends MongoDoc>(
  domainQuery: DomainPageQuery<any>,
  dbCollection: Collection<TDoc>
): Omit<GenericPageArgs<TDoc>, 'baseQuery'> {
  return {
    dbCollection,
    sortField: String(domainQuery.sortField),
    sortDir: domainQuery.sortDir === 'asc' ? 1 : -1,
    cursor: domainQuery.cursor,
    limit: domainQuery.limit,
  }
}
