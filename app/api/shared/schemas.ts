import { BYTES32_REGEX } from '#app/domain/constants/regex.js'

// range + sort fields are set separately in each query route
export const paginationQueryParams = {
  limit: { type: 'integer', minimum: 1, maximum: 100 },
  cursor: { type: 'string', pattern: '^[^_]+_[a-fA-F0-9]{24}$' },
  sortDir: { enum: ['asc', 'desc'] },
} as const

// query after chainevent fields
export const chainEventQueryableFields = {
  txHash: { type: 'string', pattern: BYTES32_REGEX },
}

export const byIdParams = (regex: string) =>
  ({
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', pattern: regex },
    },
  }) as const
