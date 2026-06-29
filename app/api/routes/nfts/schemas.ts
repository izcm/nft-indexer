import { paginationQueryParams, uint256Schema } from '#app/api/shared/schemas.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: uint256Schema }, // eg. list of owned tokenIds
}

export const attributesQueryFields = {
  trait: { type: 'string', pattern: '^[^,]+(,[^,]+)*$', maxLength: 256 },
  value: { type: 'string', pattern: '^[^,]+(,[^,]+)*$', maxLength: 256 },
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
