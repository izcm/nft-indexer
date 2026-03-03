export type Page<T> = {
  items: T[]
  nextCursor: string | null
}

export type SortDir = 'asc' | 'desc'

export type DomainPageQuery<TEntity extends object> = {
  limit: number
  cursor?: string

  from?: number
  to?: number

  rangeField?: string
  sortField: string
  // rangeField?: keyof TEntity
  // sortField: keyof TEntity
  sortDir: SortDir

  filters?: Record<string, any>
}
