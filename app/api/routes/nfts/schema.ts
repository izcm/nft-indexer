import { paginationQueryParams, uint256Schema } from '#app/api/shared/schemas.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: uint256Schema }, // eg. list of owned tokenIds
}

export const attributesQueryFields = {
  trait: { type: 'string' },
  value: { type: 'string' },
}

export const nftPageSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...nftQueryableFields,
      ...attributesQueryFields,
      ...paginationQueryParams,
    },
  },
}
