import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'

const UNIX_SECONDS_MAX = 1e11 // year ~5138

// TODO: make order sortableFields

export const orderQueryableFields = {
  actor: { type: 'string', pattern: ADDR_REGEX },
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'string' },
  currency: { type: 'string', pattern: ADDR_REGEX },
  price: { type: 'string' },
  side: { type: 'integer', minimum: 0 },
  isCollectionBid: { type: 'boolean' },
  start: { type: 'integer', minimum: 0, maximum: UNIX_SECONDS_MAX },
  end: { type: 'integer', minimum: 0, maximum: UNIX_SECONDS_MAX },

  status: { enum: ['active', 'filled', 'cancelled', 'expired'] },
}

export const orderCreateBody = {
  $id: 'order-create',
  type: 'object',
  required: [
    'actor',
    'collection',
    'currency',
    'price',
    'nonce',
    'side',
    'start',
    'end',
    'tokenId',
    'isCollectionBid',
    'signature',
  ],
  properties: {
    ...orderQueryableFields,
    nonce: { type: 'string' },
    signature: {
      type: 'object',
      required: ['r', 's', 'v'],
      properties: {
        r: { type: 'string' },
        s: { type: 'string' },
        v: { type: 'integer', minimum: 27, maximum: 28 },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const
