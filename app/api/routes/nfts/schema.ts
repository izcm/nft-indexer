import { paginationQueryParams } from '#app/api/shared/schemas.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: { type: 'string' } }, // eg. list of owned tokenIds
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
