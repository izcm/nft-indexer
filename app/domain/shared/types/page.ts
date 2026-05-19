import { AllExcept } from '../relations.js'
import { ResourceName } from './resource.js'

export type PageRequest<R extends ResourceName> = Omit<PageQuery, 'filters'> & {
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
