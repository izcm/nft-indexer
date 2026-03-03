import { UNIX_SECONDS_MAX } from '#app/domain/constants/limits.js'
import { BYTES32_REGEX } from '#app/domain/constants/regex.js'

// range + sort fields are set separately in each query route
export const paginationQueryParams = {
  limit: { type: 'integer', minimum: 1, maximum: 100 },
  cursor: { type: 'string', pattern: '^[0-9]+_[a-fA-F0-9]{24}$' },
  // from: { type: 'integer', maximum: UNIX_SECONDS_MAX },
  // to: { type: 'integer', maximum: 0 },
  // rangeField: { type: 'string' },
  // sortBy: { type: 'string' },
  sortDir: { enum: ['asc', 'desc'] },
}

export const byIdParams = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
  },
} as const

export const byIdBytes32Param = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', pattern: BYTES32_REGEX },
  },
} as const
