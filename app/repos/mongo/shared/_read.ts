import { Collection, Filter, Document as MongoDoc, WithId } from 'mongodb'

import { PageQuery } from '#app/domain/shared/types/page.js'
import { ByKey, Pageable } from '#app/domain/shared/interfaces/read-commons.js'

import { findPageGeneric } from './pagination/find-page-generic.js'
import { mapToRepoQuery } from './pagination/to-repo-query.js'
import { FieldConfig } from '../field-config.js'

export const makeReadRepo = <TDoc extends MongoDoc, TKey>(
  getCol: () => Collection<TDoc>,
  keyToFilter: (k: TKey) => Filter<TDoc>,
  fieldConfig?: FieldConfig
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

    findPage(domainPageQuery: PageQuery) {
      const repoQuery = mapToRepoQuery<TDoc>(domainPageQuery, getCol(), fieldConfig)

      return findPageGeneric<TDoc>({
        ...repoQuery,
      })
    },
  } satisfies ByKey<WithId<TDoc>, TKey> & Pageable<WithId<TDoc>>
}
