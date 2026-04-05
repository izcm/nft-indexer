import { chainEventQueryableFields, paginationQueryParams } from '#app/api/shared/schemas.js'

import { ADDR_REGEX, BYTES32_REGEX } from '#app/domain/constants/regex.js'
import { SETTLEMENT_INCLUDES } from '#app/domain/shared/relations.js'

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
}

export const settlementQueryableFields = {
  chainId: { type: 'number' },
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: { type: 'string' } }, // eg. list of owned tokenIds
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
    additionalProperties: true, // todo: make false (nft attributes need true rn)
    properties: {
      ...settlementQueryableFields,
      ...paginationQueryParams,
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
  },
}
