import { paginationQueryParams } from '#app/api/shared/schemas.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: { type: 'string' } }, // eg. list of owned tokenIds
}

export const attributesQueryFields = {
  // trait: {
  //   oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'string' }],
  // },
  // value: {
  //   oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'string' }],
  // },

  // nft attributes of order.tokenId (string can be array separated by ',')
  trait: { type: 'string' },
  value: { type: 'string' },
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
