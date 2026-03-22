import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'

export async function getOr404<T>(fn: () => Promise<T | null>, res: any) {
  const doc = await fn()
  if (!doc) {
    res.code(404)
    return
  }
  return doc
}
