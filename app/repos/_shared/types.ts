import { Collection } from 'mongodb'

// --------- cursor ---------

export type CursorDir = 1 | -1

export type CursorPageCore = {
  sortField: string
  sortDir: CursorDir
  cursor: string | null
  limit: number
}

// --------- repo layer ---------

export type FindPageArgs = CursorPageCore & {
  filters?: Record<string, any>
  from?: number
  to?: number
}

// --------- generic helper ---------

export type GenericPageArgs = CursorPageCore & {
  dbCollection: Collection<any>
  baseQuery: Record<string, any>
}
