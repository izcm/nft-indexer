import {
  encodeAbiParameters,
  getAddress,
  Hex,
  hexToBigInt,
  keccak256,
  parseAbiParameters,
} from 'viem'

const hash = (label: string, params: string[], values: readonly unknown[]) => {
  const paramStr = `string label` + (params.length === 0 ? '' : ', ' + params.join(', '))

  const abiParams = parseAbiParameters(paramStr)
  const encoded = encodeAbiParameters(abiParams, [label, ...values])

  return keccak256(encoded)
}

export const addrOf = (label: string): Hex => getAddress(bytesOf(label, 20))

export const bytes32 = (label: string): Hex => bytesOf(label, 32)

export const bytes32n = (label: string): bigint => BigInt(bytes32(label))

export const bytesOf = (label: string, bc: number): Hex => {
  if (bc <= 0 || bc > 32) {
    throw new Error('byteCount must be between 1 and 32')
  }
  return ('0x' + hash(label, [], []).slice(-(bc * 2))) as Hex
}

export const bytesOfn = (label: string, bc: number): bigint => hexToBigInt(bytesOf(label, bc))

export const priceWei = (seed: string) =>
  1_000_000_000_000_000n + (bytes32n(seed) % 1_000_000_000_000_000n)
