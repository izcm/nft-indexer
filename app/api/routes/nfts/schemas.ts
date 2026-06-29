import {
  chainIdSchema,
  basicSortFields,
  paginationQueryParams,
  uint256Schema,
} from '../../shared/schemas.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  chainId: chainIdSchema,
  collection: { type: 'string', pattern: ADDR_REGEX },
  tokenId: { type: 'array', items: uint256Schema }, // eg. list of owned tokenIds
}

export const attributesQueryFields = {
  trait: { type: 'string', pattern: '^[^,]+(,[^,]+)*$', maxLength: 256 },
  value: { type: 'string', pattern: '^[^,]+(,[^,]+)*$', maxLength: 256 },
}

// http://localhost:5000/api/nfts?chainId=11155111&collection=0x18B62abC75900D4aC06915feDdA3b481349dB321&sortField=createdAt&limit=25

export const nftPageSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...nftQueryableFields,
      ...attributesQueryFields,
      ...paginationQueryParams,
      sortField: basicSortFields,
    },
  },
}
