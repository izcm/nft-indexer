import { paginationQueryParams } from '#app/api/shared/schemas.js'

import { ADDR_REGEX } from '#app/domain/constants/regex.js'
import { SETTLEMENT_SORT_FIELDS } from '#app/domain/settlement/model.js'
import { SETTLEMENT_INCLUDES } from '#app/domain/shared/relations.js'

export const settlementQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: { type: 'string' } }, // eg. list of owned tokenIds
  seller: { type: 'string', pattern: ADDR_REGEX },
  buyer: { type: 'string', pattern: ADDR_REGEX },
} as const

export const settlementPageQuery = {
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {
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
