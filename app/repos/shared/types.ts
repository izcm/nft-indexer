import type { Collection, Document as MongoDoc } from 'mongodb'

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

// --------- generics ---------

export type GenericPageArgs<TDoc extends MongoDoc> = CursorPageCore & {
  dbCollection: Collection<TDoc>
  baseQuery: Record<string, any>
}

export type Page<T> = {
  items: T[]
  nextCursor: string | null
}
