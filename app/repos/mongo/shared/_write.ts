import { Collection, UpdateFilter, UpdateOptions, Document as MongoDoc, Filter } from 'mongodb'

import { WithTimestamps } from '#app/domain/shared/types/with-timestamps.js'

/**
 * @param getCol collection for write operation
 * @returns mongoDb write ops wrappers that set createdAt + updatedAt timestamps
 */
export const makeTsWrite = <TDoc extends MongoDoc & WithTimestamps>(
  getCol: () => Collection<TDoc>
) => {
  return {
    updateOne(filter: Filter<TDoc>, update: UpdateFilter<TDoc>, options?: UpdateOptions) {
      const col = getCol()

      return col.updateOne(
        filter,
        {
          ...update,
          $set: {
            ...(update.$set ?? {}),
            updatedAt: Date.now(),
          } as Partial<TDoc>,
          $setOnInsert: {
            ...(update.$setOnInsert ?? {}),
            createdAt: Date.now(),
          } as Partial<TDoc>,
        },
        options
      )
    },

    updateMany(filter: Filter<TDoc>, update: UpdateFilter<TDoc>, options?: UpdateOptions) {
      const col = getCol()

      return col.updateOne(
        filter,
        {
          ...update,
          $set: {
            ...(update.$set ?? {}),
            updatedAt: Date.now(),
          } as Partial<TDoc>,
        },
        options
      )
    },
  }
}
