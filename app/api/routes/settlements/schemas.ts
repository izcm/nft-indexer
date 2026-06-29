import {
  chainEventQueryableFields,
  chainIdSchema,
  paginationQueryParams,
  uint256Schema,
} from '#app/api/shared/schemas.js'

import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'
import { SETTLEMENT_INCLUDES } from '#app/read/shared/relations.js'
import { attributesQueryFields } from '../nfts/schemas.js'

// --- sort whitelist + domain-shape field mapping ---

export const SETTLEMENT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'price',
  'buyer',
  'seller',
  'timestamp',
] as const

export const SETTLEMENT_SORT_FIELDS_MAP = {
  timestamp: 'execution.block.timestamp',
} as const

export const settlementQueryableFields = {
  chainId: chainIdSchema,
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: uint256Schema }, // eg. list of owned tokenIds
  seller: { type: 'string', pattern: ADDR_REGEX },
  buyer: { type: 'string', pattern: ADDR_REGEX },
  orderHash: { type: 'string', pattern: BYTES32_REGEX },
  ...chainEventQueryableFields,
} as const

export const settlementNestedMap = Object.fromEntries(
  Object.keys(chainEventQueryableFields).map(k => [k, `execution.${k}`])
)

export const settlementPageQuery = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...settlementQueryableFields,
      ...paginationQueryParams,
      ...attributesQueryFields,
      sortField: {
        type: 'string',
        enum: [...SETTLEMENT_SORT_FIELDS],
      },
      include: {
        type: 'array',
        maxItems: SETTLEMENT_INCLUDES.length,
        items: { type: 'string', enum: SETTLEMENT_INCLUDES },
      },
    },

    patternProperties: {
      '^or\\.(buyer|seller)$': {
        anyOf: [
          { type: 'string', pattern: ADDR_REGEX },
          { type: 'array', items: { type: 'string', pattern: ADDR_REGEX } },
        ],
      },
    },
  },
}
