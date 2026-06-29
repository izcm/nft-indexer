import { BYTES32_REGEX } from '#app/domain/constants/regex.js'

// uint256 values
export const uint256Schema = {
  type: 'string',
  pattern: '^[0-9]+$',
  maxLength: 78,
} as const

export const chainIdSchema = {
  type: 'integer',
  enum: [1, 11155111, 31337],
} as const

// range + sort fields are set separately in each query route
export const paginationQueryParams = {
  limit: { type: 'integer', minimum: 1, maximum: 100 },
  cursor: { type: 'string', pattern: '^[^_]{1,78}_[a-fA-F0-9]{24}$', maxLength: 103 },
  sortDir: { type: 'string', enum: ['asc', 'desc'] },
} as const

// query after chainevent fields
export const chainEventQueryableFields = {
  txHash: { type: 'string', pattern: BYTES32_REGEX },
} as const

export const byIdParams = (regex: string) =>
  ({
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', pattern: regex },
    },
  }) as const
