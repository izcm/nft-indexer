export type Address = `0x${string}`
export type Hash = `0x${string}`

const isHexPrefixed = (s: string) => s.startsWith('0x')
const isHex = (s: string) => /^[0-9a-fA-F]+$/.test(s)

export function asAddress(input: string): Address {
  if (!isHexPrefixed(input)) throw new Error('Address must start with 0x')
  const hex = input.slice(2)
  if (hex.length !== 40 || !isHex(hex)) throw new Error('Invalid address')
  return input as Address
}

export function asHash(input: string): Hash {
  if (!isHexPrefixed(input)) throw new Error('Hash must start with 0x')
  const hex = input.slice(2)
  if (hex.length !== 64 || !isHex(hex)) throw new Error('Invalid hash')
  return input as Hash
}
