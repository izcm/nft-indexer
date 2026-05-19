import { DEFAULT_PAGE_LIMIT } from '#app/config/api.js'

/**
 * Builds a Mongo-compatible filter object from a Fastify query.
 *
 * @param q       Incoming query object (e.g. Fastify request.query)
 * @param fields  Allowed filter keys (usually schema/queryable fields)
 * @param nested  Maps query fields to their domain paths
 * @param orTransform Transform .or fields from string to domain type
 *
 * @returns An object ready to be transformed to repo query.
 */
export function buildFilters(
  q: Record<string, unknown>,
  fields: Record<string, unknown>,
  nested?: Record<string, string>, // key => path
  orTransform?: (k: string, v: unknown) => unknown
): Record<string, unknown> {
  const filters: { [key: string]: unknown; or?: Record<string, unknown>[] } = {}
  const approved = new Set(Object.keys(fields))

  for (const [rawKey, rawValue] of Object.entries(q)) {
    const isOr = rawKey.startsWith('or.')
    const key = isOr ? rawKey.slice(3) : rawKey

    if (!approved.has(key)) continue

    const v = clean(rawValue)
    if (v == null) continue

    // set correct path for nested fields
    const path = nested?.[key] ?? key

    if (isOr) {
      ;(filters.or ??= []).push({ [path]: orTransform ? orTransform(key, v) : v })
    } else {
      filters[path] = v
    }
  }

  return filters
}

function clean(v: unknown) {
  if (Array.isArray(v)) {
    const arr = v.map(x => (typeof x === 'string' ? x.trim() : x)).filter(x => x !== '')

    return arr.length ? arr : undefined
  }

  if (typeof v === 'string') {
    const s = v.trim()
    return s === '' ? undefined : s
  }

  return v
}

// todo: make params.attributes accept fmt trait=color:red,size:L
export function buildAttributeFilters(q: Record<string, unknown>) {
  const rawTraits = q.trait
  const rawValues = q.value

  const traits = typeof rawTraits === 'string' ? rawTraits.split(',') : []
  const values = typeof rawValues === 'string' ? rawValues.split(',') : []

  if (!traits.length && !values.length) return {}

  if (traits.length !== values.length) {
    throw new Error('trait/value length mismatch')
  }

  const grouped: Record<string, string[]> = {}

  for (const [i, t] of traits.entries()) {
    ;(grouped[t] ??= []).push(values[i])
  }

  return {
    attributes: Object.entries(grouped).map(([trait, value]) => ({
      trait,
      value,
    })),
  }
}

export const buildPageQuery = (
  q: any,
  sortFieldMap?: Record<string, string>,
  opts?: { defaultSortField: string; defaultSortDir: 'asc' | 'desc' }
) => {
  const sortField = q.sortField ?? opts?.defaultSortField ?? 'updatedAt'
  const sortDir = q.sortDir ?? opts?.defaultSortDir ?? 'desc'

  return {
    limit: q.limit ?? DEFAULT_PAGE_LIMIT,
    cursor: q.cursor,
    from: q.from,
    to: q.to,
    rangeField: q.rangeField,
    sortField: sortFieldMap?.[sortField] ?? sortField,
    sortDir,
  }
}
