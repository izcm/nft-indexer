export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export function applyDeepPartial<T>(base: T, patch: DeepPartial<T>): T {
  // if patch is not an object -> replace
  if (patch === undefined || patch === null) return base
  if (typeof patch !== 'object') return patch as T

  // arrays: replace (NOT merge)
  if (Array.isArray(patch)) return patch as T

  const result: any = { ...base }

  for (const key in patch) {
    const p = (patch as any)[key]
    const b = (base as any)?.[key]

    if (p !== undefined && p !== null && typeof p === 'object' && !Array.isArray(p)) {
      result[key] = applyDeepPartial(b ?? {}, p)
    } else {
      result[key] = p
    }
  }

  return result
}
