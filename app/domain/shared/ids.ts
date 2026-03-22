export function parseDomainId(id: string) {
  const [chainId, value] = id.split(':')
  return { chainId: Number(chainId), value }
}

export function parseTripleDomainId(id: string) {
  const [chainId, collection, tokenId] = id.split(':')

  if (!chainId || !collection || !tokenId) {
    throw new Error('!invalid id')
  }

  return {
    chainId: Number(chainId),
    collection,
    tokenId,
  }
}
