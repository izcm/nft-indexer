import { ObjectId } from 'mongodb'
import { CursorPageCore, CursorDir } from './types.js'

export const walkPath = (obj: any, path: string) => {
  return path.split('.').reduce((curr, k) => curr[k], obj)
}

export const encodeCursor = (value: number, id: ObjectId) => `${value}_${id.toString()}`

export const buildSortSpec = (field: string, dir: CursorDir) => ({
  [field]: dir,
  _id: dir,
})

export function buildCursorFilter({
  sortField: field,
  sortDir: dir,
  cursor,
}: Omit<CursorPageCore, 'limit'>) {
  if (!cursor) return null

  const [rawVal, rawId] = cursor.split('_')
  const value = Number(rawVal)
  const id = new ObjectId(rawId)

  const cmp = dir === 1 ? '$gt' : '$lt'

  return {
    $or: [{ [field]: { [cmp]: value } }, { [field]: { value, id: { [cmp]: id } } }],
  }
}
