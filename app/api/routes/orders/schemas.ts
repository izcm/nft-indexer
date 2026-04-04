import { chainEventQueryableFields, paginationQueryParams } from '#app/api/shared/schemas.js'

import { UNIX_SECONDS_MAX } from '#app/domain/constants/limits.js'
import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'
import { ORDER_INCLUDES } from '#app/domain/shared/relations.js'

// --- query model ---

export const ORDER_SORT_FIELDS = ['createdAt', 'updatedAt'] as const
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number]

// === field defs ===

export const orderCoreFieldSchema = {
  actor: { type: 'string', pattern: ADDR_REGEX },
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: { type: 'string' } }, // eg. list of owned tokenIds
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
  chainId: { type: 'number' },
  orderHash: { type: 'string', pattern: BYTES32_REGEX },
  status: { type: 'string', enum: ['active', 'filled', 'cancelled', 'expired'] },
} as const

export const orderRecordNestedMap = {
  ...Object.fromEntries(Object.keys(chainEventQueryableFields).map(k => [k, `chainEvent.${k}`])),
  ...Object.fromEntries(Object.keys(orderCoreFieldSchema).map(k => [k, `order.${k}`])),
}

// === create body ===

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
    tokenId: { type: 'string' }, // eg. list of owned tokenIds
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
    additionalProperties: true, // todo: make false (nft attributes need true rn)
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
