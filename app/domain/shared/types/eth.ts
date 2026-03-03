export type Address = `0x${string}`
export type Hash = `0x${string}`

export type BlockRef = {
  number: number
  timestamp: number
}

export type TxContext = {
  index: number
  gasUsed: string
  effectiveGasPrice: string
  functionSelector: `0x${string}`
  functionName: string
  contractAddress: Address | null
}
