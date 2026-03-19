import { NFTAttribute } from '#app/domain/nft/model.js'

export function parseTokenUri(tokenUri: string) {
  const prefix = 'data:application/json;base64,'

  if (!tokenUri.startsWith(prefix)) return null

  try {
    const base64 = tokenUri.slice(prefix.length)
    const json = atob(base64)
  } catch {
    return null
  }
}

export function parseAttributes(input: unknown) {
  if (!Array.isArray(input)) return []

  const attributes = input
    .map(a => {
      // a is an attribute ?
      // it should be on form { trait_type, value}
      if (
        typeof a === 'object' &&
        typeof a.trait_type === 'string' &&
        typeof a.value === 'string'
      ) {
        // a valid trait_type!
        return {
          trait_type: a.trait_type,
          value: a.value,
        }
      }
      return null
    })
    .filter((a): a is NFTAttribute => a !== null)

  return attributes
}
