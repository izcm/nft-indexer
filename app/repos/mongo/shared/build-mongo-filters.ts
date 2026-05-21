import { FieldConfig } from './field-config.js'

export function buildMongoFilters(
  filters: Record<string, unknown>,
  opts?: {
    from?: number
    to?: number
    rangeField?: string
    fieldConfig?: FieldConfig
    acceptedOrFields?: Set<string>
  }
) {
  const { from, to, rangeField, fieldConfig } = opts ?? {}
  const baseQuery: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(filters)) {
    if (k === 'attributes') continue

    const conf = fieldConfig?.[k]
    const dbField = conf?.dbField ?? k

    const arr = Array.isArray(v) ? v : [v]
    const mapped = conf?.toDb ? arr.map(conf.toDb) : arr

    baseQuery[dbField] = mapped.length === 1 ? mapped[0] : { $in: mapped }
  }

  const attrAnd = handleAttributes(filters)
  if (attrAnd.length) {
    baseQuery.$and = attrAnd
  }

  if ((from || to) && rangeField) {
    const k = fieldConfig?.[rangeField]?.dbField ?? rangeField

    const range: { $gte?: number; $lte?: number } = {}

    if (from !== undefined) range.$gte = from
    if (to !== undefined) range.$lte = to

    baseQuery[k] = range
  }

  return baseQuery
}

function handleAttributes(filters: Record<string, unknown>) {
  // valuer per trait
  const groups: Record<string, string[]> = {}

  // push pairs from filters to groups
  if (Array.isArray(filters.attributes)) {
    const pairs = filters.attributes

    for (const { trait, value } of pairs) {
      if (!groups[trait]) groups[trait] = []

      const values = Array.isArray(value) ? value : [value]

      groups[trait].push(...values)
    }
  }

  // make an attribute for each group with $in operator if multiple values
  return Object.entries(groups).map(([trait, vals]) => ({
    attributes: {
      $elemMatch: {
        trait_type: trait,
        value: vals.length > 1 ? { $in: vals } : vals[0],
      },
    },
  }))
}
