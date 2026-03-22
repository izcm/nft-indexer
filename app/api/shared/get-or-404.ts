export async function getOr404<T>(fn: () => Promise<T | null>, res: any) {
  const doc = await fn()
  if (!doc) {
    res.code(404)
    return
  }
  return doc
}
