import { ObjectId } from 'mongodb'

type CursorDir = 1 | -1

type BuildCursorArgs = {
  field: string
  dir: CursorDir
  cursor?: string | null
}

export const walkPath = (obj: any, path: string) => {
  return path.split('.').reduce((curr, k) => curr[k], obj)
}

export const encodeCursor = (value: number, id: ObjectId) => `${value}_${id.toString()}`

export const buildSortSpec = (field: string, dir: CursorDir) => ({
  [field]: dir,
  _id: dir,
})

export const buildCursorFilter = ({ field, dir, cursor }: BuildCursorArgs) => {
  if (!cursor) return null

  const [rawVal, rawId] = cursor.split('_')
  const value = Number(rawVal)
  const id = new ObjectId(rawId)

  const cmp = dir === 1 ? '$gt' : '$lt'

  return {
    $or: [{ [field]: { [cmp]: value } }, { [field]: { value, id: { [cmp]: id } } }],
  }
}
