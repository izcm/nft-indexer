import { Collection, Filter, Document as MongoDoc, WithId } from 'mongodb'

import { PageQuery } from '#app/domain/shared/types/page.js'
import { ByKey, Countable, Pageable } from '#app/domain/shared/interfaces/read-commons.js'

import { findPageGeneric } from './pagination/find-page-generic.js'
import { mapToRepoQuery } from './to-repo-query.js'
import { FieldConfig } from '../model/field-config.js'

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

    findPage(pageQuery: PageQuery) {
      const repoQuery = mapToRepoQuery<TDoc>(pageQuery, getCol(), fieldConfig)

      return findPageGeneric<TDoc>({
        ...repoQuery,
      })
    },

    count(args: Pick<PageQuery, 'filters'>) {
      const { baseQuery } = mapToRepoQuery<TDoc>(
        { filters: args.filters, sortField: '', sortDir: 'desc', limit: 0 },
        getCol(),
        fieldConfig
      )
      return getCol().countDocuments(baseQuery)
    },
  } satisfies ByKey<WithId<TDoc>, TKey> & Pageable<WithId<TDoc>> & Countable
}
