import { Collection, Filter, Document as MongoDoc, WithId } from 'mongodb'

import { DomainPageQuery } from '#app/domain/shared/types/page.js'
import { ByKey, Pageable } from '#app/domain/shared/interfaces/read-commons.js'

import { findPageGeneric } from './pagination/find-page-generic.js'
import { mapDomainToRepoQuery } from './pagination/to-repo-query.js'

export const makeReadRepo = <TDoc extends MongoDoc, TKey>(
  getCol: () => Collection<TDoc>,
  keyToFilter: (k: TKey) => Filter<TDoc>
) => {
  return {
    findByKey(key: TKey) {
      return getCol().findOne(keyToFilter(key))
    },

    async findByKeys(keys: TKey[]) {
      if (!keys.length) return []

      return getCol()
        .find({ $or: keys.map(keyToFilter) } as Filter<TDoc>)
        .toArray()
    },

    findPage(domainPageQuery: DomainPageQuery) {
      const repoQuery = mapDomainToRepoQuery<TDoc>(domainPageQuery, getCol())

      return findPageGeneric<TDoc>({
        ...repoQuery,
      })
    },
  } satisfies ByKey<WithId<TDoc>, TKey> & Pageable<WithId<TDoc>>
}
