import { paginationQueryParams } from '#app/api/shared/schemas.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
}

export const attributesQueryFields = {
  trait: { type: 'array', items: { type: 'string' } },
  value: { type: 'array', items: { type: 'string' } },
}

export const nftPageSchema = {
  querystring: {
    type: 'object',
    additionalProperties: true,
    properties: {
      ...nftQueryableFields,
      ...attributesQueryFields,
      ...paginationQueryParams,
    },
  },
}
