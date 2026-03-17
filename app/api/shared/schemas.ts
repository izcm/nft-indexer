// range + sort fields are set separately in each query route
export const paginationQueryParams = {
  limit: { type: 'integer', minimum: 1, maximum: 100 },
  cursor: { type: 'string', pattern: '^[0-9]+_[a-fA-F0-9]{24}$' },
  sortDir: { enum: ['asc', 'desc'] },
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
