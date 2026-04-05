import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'

/**
 * Builds a Mongo-compatible filter object from a Fastify query.
 *
 * @param q       Incoming query object (e.g. Fastify request.query)
 * @param fields  Allowed filter keys (usually schema/queryable fields)
 *
 * @returns A flat object suitable for MongoDB filtering
 */
export function buildFilters(
  q: Record<string, unknown>,
  fields: Record<string, unknown>,
  nested?: Record<string, string> // key => path
): Record<string, unknown> {
  const filters: Record<string, unknown> = {}

  for (const key of Object.keys(fields)) {
    const v = q[key]
    if (v === undefined) continue

    // set correct path for nested fields
    const path = nested?.[key] ?? key

    filters[path] = v
  }

  return filters
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

export const basePageQuery = (q: any) => {
  return {
    limit: q.limit ?? DEFAULT_PAGE_LIMIT,
    cursor: q.cursor,
    from: q.from,
    to: q.to,
    rangeField: q.rangeField ?? 'updatedAt', // todo: dont hardcode this
    sortField: q.sortField ?? 'updatedAt',
    sortDir: q.sortDir ?? 'desc',
  }
}
