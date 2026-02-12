export type FindPageArgs = {
  filters: Record<string, any>
  from?: number
  to?: number
  cursor?: string
  sortField: string
  sortDir: 1 | -1
  limit: number
}
