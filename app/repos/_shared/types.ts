export type FindPageArgs = {
  filters: Record<string, any>
  from?: number
  to?: number
  cursor?: string
  limit: number
}
