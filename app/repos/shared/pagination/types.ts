import type { Collection, Filter, Document as MongoDoc } from 'mongodb'

export type MongoSortDir = 1 | -1

export type CursorPageCore = {
  cursor?: string
  limit: number
  sortField: string
  sortDir: MongoSortDir
}

export type GenericPageArgs<TDoc extends MongoDoc> = CursorPageCore & {
  dbCollection: Collection<TDoc>
  baseQuery: Filter<TDoc>
}
