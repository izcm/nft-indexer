import { buildCursorFilter, buildSortSpec, encodeCursor, walkPath } from './cursor.js'
import { GenericPageArgs } from './types.js'

export const findPageGeneric = async ({
  collection,
  baseQuery,
  sortField,
  sortDir,
  cursor,
  limit,
}: GenericPageArgs) => {
  const query = { ...baseQuery }

  const cursorFilter = buildCursorFilter({ sortField, sortDir, cursor })

  if (cursorFilter) {
    query.$and = [...(query.$and ?? []), cursorFilter]
  }

  // now we have the cursorfilters and can query db
  const docs = await collection
    .find(query)
    .sort(buildSortSpec(sortField, sortDir))
    .limit(limit + 1)
    .toArray()

  let nextCursor = null

  if (docs.length > limit) {
    const last = docs[limit - 1]
    const fieldValue = walkPath(last, sortField)

    nextCursor = encodeCursor(fieldValue, last._id)
  }

  return {
    items: docs.slice(0, limit),
    nextCursor,
  }
}
