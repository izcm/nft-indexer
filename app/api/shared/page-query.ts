import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'

/**
 * Builds a Mongo-compatible filter object from a Fastify query.
 *
 * @param q       Incoming query object (e.g. Fastify request.query)
 * @param fields  Allowed filter keys (usually schema/queryable fields)
 * @param nestedKeys Keys that belong to a nested object (will be prefixed)
 * @param nestedPath  Path to prepend for nested keys (e.g. "order")
 *
 * @returns A flat object suitable for MongoDB filtering
 */
export function buildFilters(
  q: Record<string, unknown>,
  fields: Record<string, unknown>,
  nestedKeys?: Set<string>,
  nestedPath?: string
): Record<string, unknown> {
  const filters: Record<string, unknown> = {}

  for (const key of Object.keys(fields)) {
    const v = q[key]
    if (v === undefined) continue

    // set correct path for nested fields
    const path = nestedKeys?.has(key) ? `${nestedPath}.${key}` : key

    filters[path] = v
  }

  return filters
}

export function buildAttributeFilters(q: Record<string, unknown>) {
  const rawTraits = q.trait
  const rawValues = q.value

  const traits = typeof rawTraits === 'string' ? rawTraits.split(',') : []
  const values = typeof rawValues === 'string' ? rawValues.split(',') : []

  if (!traits.length && !values.length) return {}

  if (traits.length !== values.length) {
    throw new Error('trait/value length mismatch')
  }

  return {
    attributes: traits.map((trait, i) => ({
      trait,
      value: values[i],
    })),
  }
}

export const basePageQuery = (q: any) => {
  return {
    limit: q.limit ?? DEFAULT_PAGE_LIMIT,
    cursor: q.cursor,
    from: q.from,
    to: q.to,
    rangeField: q.rangeField ?? 'createdAt', // todo: dont hardcode this
    sortField: q.sortField ?? 'createdAt',
    sortDir: q.sortDir ?? 'desc',
  }
}
