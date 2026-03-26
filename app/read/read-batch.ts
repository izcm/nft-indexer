import { ADDR_REGEX } from '#app/domain/constants/regex.js'

export const nftQueryableFields = {
  collection: { type: 'string', pattern: ADDR_REGEX },
}
