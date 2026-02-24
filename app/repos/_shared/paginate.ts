import { buildCursorFilter, buildSortSpec, encodeCursor, walkPath } from './cursor.js'
import { GenericPageArgs } from './types.js'
export async function findPageGeneric({
  dbCollection,
  baseQuery,
  sortField,
  sortDir,
  cursor,
  limit,
}: GenericPageArgs) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Invalid pagination limit')

  const query = { ...baseQuery }

  const cursorFilter = buildCursorFilter({ sortField, sortDir, cursor })

  if (cursorFilter) {
    query.$and = [...(query.$and ?? []), cursorFilter]
  }

  const sortSpec = buildSortSpec(sortField, sortDir)

  const docs = await dbCollection
    .find(query)
    .sort(sortSpec)
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
