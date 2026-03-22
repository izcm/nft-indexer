import { paginationQueryParams } from '#app/api/shared/schemas.js'

import { UNIX_SECONDS_MAX } from '#app/domain/constants/limits.js'
import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'
import { ORDER_SORT_FIELDS } from '#app/domain/order/model.js'
import { ORDER_INCLUDES } from '#app/domain/shared/relations.js'

// === query ===

export const orderCoreFieldSchema = {
  actor: { type: 'string', pattern: ADDR_REGEX },
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'string' },
  currency: { type: 'string', pattern: ADDR_REGEX },
  price: { type: 'string' },
  side: { type: 'integer', minimum: 0 },
  isCollectionBid: { type: 'boolean' },
  start: { type: 'integer', minimum: 0, maximum: UNIX_SECONDS_MAX },
  end: { type: 'integer', minimum: 0, maximum: UNIX_SECONDS_MAX },
} as const

export const orderCoreQueryableFields = orderCoreFieldSchema
export const orderRecordQueryableFields = {
  ...orderCoreQueryableFields,
  status: { type: 'string', enum: ['active', 'filled', 'cancelled', 'expired'] },
} as const

// === ingest ===

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
    ...orderCoreFieldSchema,
    nonce: { type: 'string' },
    signature: {
      type: 'object',
      required: ['r', 's', 'v'],
      properties: {
        r: { type: 'string', pattern: BYTES32_REGEX },
        s: { type: 'string', pattern: BYTES32_REGEX },
        v: { type: 'integer', minimum: 27, maximum: 28 },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const

// === page schema ===
export const orderPageSchema = {
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {
      ...orderRecordQueryableFields,
      ...paginationQueryParams,
      sortField: {
        type: 'string',
        enum: [...ORDER_SORT_FIELDS],
      },
      include: {
        type: 'array',
        maxItems: ORDER_INCLUDES.length,
        items: { type: 'string', enum: ORDER_INCLUDES },
      },
    },
  },
}
