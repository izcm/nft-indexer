import { ResourceName } from './resource.js'

export type AllExcept<R extends ResourceName> = Exclude<ResourceName, R>

export type PageRequest<R extends ResourceName> = PageQuery & {
  include?: AllExcept<R>[]
}

export type Page<T> = {
  items: T[]
  nextCursor: string | null
}

export type SortDir = 'asc' | 'desc'

export type PageQuery = {
  limit: number
  cursor?: string

  from?: number
  to?: number

  rangeField?: string
  sortField: string

  sortDir: SortDir

  filters?: { [key: string]: unknown; or?: Record<string, unknown>[] }
}
