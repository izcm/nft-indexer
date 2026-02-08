import { Hex, keccak256, encodeAbiParameters, parseAbiParameters } from 'viem'

const hash = (label: string, params: string[], values: readonly unknown[]) => {
  const paramStr = `string label` + (params.length === 0 ? '' : ', ' + params.join(', '))

  const abiParams = parseAbiParameters(paramStr)
  const encoded = encodeAbiParameters(abiParams, [label, ...values])

  return keccak256(encoded)
}

export const addrOf = (label: string): Hex => bytesOf(label, 20)

export const bytes32 = (label: string): Hex => bytesOf(label, 32)

export const bytes32n = (label: string): bigint => BigInt(bytes32(label))

export const bytesOf = (label: string, byteCount: number): Hex => {
  if (byteCount <= 0 || byteCount > 32) {
    throw new Error('byteCount must be between 1 and 32')
  }
  return ('0x' + hash(label, [], []).slice(-(byteCount * 2))) as Hex
}
