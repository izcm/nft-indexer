import type { NFTAttribute, NFTMetadata } from '#app/domain/nft/model.js'

export function parseTokenUri(tokenUri: string): NFTMetadata | null {
  const prefix = 'data:application/json;base64,'

  if (!tokenUri.startsWith(prefix)) return null

  try {
    const base64 = tokenUri.slice(prefix.length)
    const json = atob(base64)
    const data = JSON.parse(json)

    const name = typeof data.name === 'string' ? data.name : undefined
    const description = typeof data.description === 'string' ? data.description : undefined
    const image = typeof data.image === 'string' ? data.image : undefined

    const attributes = sanitizeAttributes(data.attributes)

    return {
      name,
      description,
      image,
      attributes,
    }
  } catch {
    return null
  }
}

export function sanitizeAttributes(input: unknown) {
  if (!Array.isArray(input)) return []

  const attributes = input
    .map(a => {
      // a is an attribute ?
      // it should be on form { trait_type, value}
      if (
        typeof a === 'object' &&
        a !== null &&
        typeof a.trait_type === 'string' &&
        (typeof a.value === 'string' || typeof a.value === 'number')
      ) {
        // a valid trait_type!
        return {
          trait_type: a.trait_type,
          value: a.value.toString(), // keeping it simple => all values stored as string
        }
      }
      return null
    })
    .filter((a): a is NFTAttribute => a !== null)

  return attributes
}
