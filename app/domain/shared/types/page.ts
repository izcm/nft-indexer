export type Page<T> = {
  items: T[]
  nextCursor: string | null
}

export type SortDir = 'asc' | 'desc'

export type DomainPageQuery = {
  limit: number
  cursor?: string

  from?: number
  to?: number

  rangeField?: string
  sortField: string

  sortDir: SortDir

  filters?: Record<string, unknown>
}
