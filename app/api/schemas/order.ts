import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'

export const orderQueryableFields = {
  actor: { type: 'string', pattern: ADDR_REGEX },
  collection: { type: 'string', pattern: ADDR_REGEX },
  currency: { type: 'string', pattern: ADDR_REGEX },
  price: { type: 'string' },
  nonce: { type: 'string' },
  side: { type: 'integer', minimum: 0 },
  start: { type: 'integer', minimum: 0 },
  end: { type: 'integer', minimum: 0 },
  tokenId: { type: 'string' },
  isCollectionBid: { type: 'boolean' },

  // order-state queryableFields
  status: { enum: ['active', 'filled', 'cancelled', 'expired'] },
  // chainId:
  // orderHash: { type: 'string', pattern: BYTES32_REGEX },
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
