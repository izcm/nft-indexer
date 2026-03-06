import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const settlementQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'string', pattern: '^[0-9]+$' },
  seller: { type: 'string', pattern: ADDR_REGEX },
  buyer: { type: 'string', pattern: ADDR_REGEX },
  from: { type: 'integer', minimum: 0 }, // timestamp
  to: { type: 'integer', minimum: 0 }, // timestamp
  limit: { type: 'integer', minimum: 1, maximum: 100 },
  cursor: { type: 'string', pattern: '^[0-9]+_[a-fA-F0-9]{24}$' },
} as const
