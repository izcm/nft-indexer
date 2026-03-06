export function parseDomainId(id: string) {
  const [chainId, value] = id.split(':')
  return { chainId: Number(chainId), value }
}
