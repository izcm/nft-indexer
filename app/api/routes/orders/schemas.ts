import {
  chainEventQueryableFields,
  chainIdSchema,
  paginationQueryParams,
  uint256Schema,
} from '../../shared/schemas.js'

import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'
import { Status } from '#app/domain/shared/status.js'
import { ORDER_INCLUDES } from '#app/read/shared/relations.js'

import { attributesQueryFields } from '../nfts/schemas.js'

// --- sorting ---

export const ORDER_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'price',
  'start',
  'expires', // same as end
  'end',
  'actor',
] as const

// all sort on fields of type string are transformed to ints in repo layer
export const ORDER_SORT_FIELDS_MAP = {
  price: 'order.price',
  actor: 'order.actor',
  start: 'order.start',
  expires: 'order.end',
  end: 'order.end',
} as const

export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number]

// === field defs ===

export const orderCoreFieldSchema = {
  actor: { type: 'string', pattern: ADDR_REGEX },
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: uint256Schema }, // eg. list of owned tokenIds
  currency: { type: 'string', pattern: ADDR_REGEX },
  price: uint256Schema,
  side: { type: 'integer', minimum: 0, maximum: 1 },
  isCollectionBid: { type: 'boolean' },
  start: { type: 'integer', minimum: 0, maximum: 1e11 },
  end: { type: 'integer', minimum: 0, maximum: 1e11 },
} as const

export const orderCoreQueryableFields = orderCoreFieldSchema
export const orderRecordQueryableFields = {
  ...orderCoreQueryableFields,
  ...chainEventQueryableFields,
  chainId: chainIdSchema,
  orderHash: { type: 'string', pattern: BYTES32_REGEX },
  status: {
    type: 'array',
    maxItems: Object.keys(Status).length,
    items: { type: 'string', enum: ['active', 'filled', 'cancelled', 'expired'] },
  },
} as const

// these mappings ar domain specific
// other mappings (eg. for denormalized mongo docs) happen in repo layer
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
    tokenId: uint256Schema,
    nonce: uint256Schema,
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
    additionalProperties: false,

    properties: {
      ...orderRecordQueryableFields,
      ...paginationQueryParams,
      ...attributesQueryFields,
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

    patternProperties: {
      '^or\\.side$': {
        anyOf: [
          { type: 'string', pattern: '^[01]$' },
          { type: 'array', items: { type: 'string', pattern: '^[01]$' } },
        ],
      },

      '^or\\.tokenId$': {
        anyOf: [uint256Schema, { type: 'array', items: uint256Schema }],
      },
    },
  },
}

// Query parameters are parsed as string|string[].
// Convert fields whose domain type is not string.
export const orTransform = (k: string, v: unknown) => {
  if (k === 'side') {
    return Array.isArray(v) ? v.map(Number) : Number(v)
  }
  return v
}
