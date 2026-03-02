import type { Collection, Document as MongoDoc } from 'mongodb'

// --------- shared window (external pagination concept) ---------

export type PageWindow = {
  from?: number
  to?: number
  cursor?: string
  limit?: number
}

// --------- cursor mechanics (internal engine requirements) ---------

export type CursorDir = 1 | -1

export type CursorPageCore = Omit<PageWindow, 'limit'> & {
  limit: number // required internally
  sortField: string
  sortDir: CursorDir
}

// --------- repo layer input ---------

export type FindPageArgs = CursorPageCore & {
  filters?: Record<string, any>
}

// --------- generic pagination engine ---------

export type GenericPageArgs<TDoc extends MongoDoc> = CursorPageCore & {
  dbCollection: Collection<TDoc>
  baseQuery: Record<string, any>
}

export type Page<T> = {
  items: T[]
  nextCursor: string | null
}
