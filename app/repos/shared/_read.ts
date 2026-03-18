import { Collection, Filter, Document as MongoDoc, WithId } from 'mongodb'

import { DomainPageQuery } from '#app/domain/shared/types/page.js'
import { ByKey, Pageable } from '#app/domain/shared/interfaces/read-commons.js'

import { findPageGeneric } from './pagination/find-page-generic.js'
import { mapDomainToRepoQuery } from './pagination/page-mapper.js'

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

    findPage(pageQuery: DomainPageQuery<TDoc>) {
      const { filters = {}, from, to, rangeField } = pageQuery
      const query: Record<string, any> = { ...filters }

      if ((from || to) && rangeField) {
        const k = String(rangeField)
        query[k] = {}
        if (from) query[k].$gte = from
        if (to) query[k].$lte = to
      }

      const repoCore = mapDomainToRepoQuery<TDoc>(pageQuery as any, getCol())

      return findPageGeneric<TDoc>({
        ...repoCore,
        baseQuery: query as Filter<TDoc>,
      })
    },
  } satisfies ByKey<WithId<TDoc>, TKey> & Pageable<WithId<TDoc>>
}
