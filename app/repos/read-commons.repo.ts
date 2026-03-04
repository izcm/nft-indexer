import { Collection, Filter, Document as MongoDoc, ObjectId, WithId } from 'mongodb'
import { findPageGeneric } from './shared/pagination/find-page-generic.js'
import { mapDomainToRepoQuery } from './shared/pagination/page-mapper.js'
import { DomainPageQuery } from '#app/domain/shared/types/page.js'
import { ById, ByKey, Pageable } from '#app/domain/shared/interfaces/read-commons.js'

export const createReadRepo = <TDoc extends MongoDoc, TKey>(
  getCol: () => Collection<TDoc>,
  keyToFilter: (k: TKey) => Filter<TDoc>
) => {
  return {
    findById(id: ObjectId) {
      return getCol().findOne({ _id: id } as Filter<TDoc>)
    },

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
  } satisfies ById<WithId<TDoc>, ObjectId> & ByKey<WithId<TDoc>, TKey> & Pageable<WithId<TDoc>>
}
