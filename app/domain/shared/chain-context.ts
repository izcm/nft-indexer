// === SHARED METADATA WRAPPERS ===

import type { Hex } from 'viem'

export type ListenerItem = {
  log: any // decoded viem log
  chainId: number
}

export type BlockTime = {
  number: number
  timestamp: number
}

export type TxContext = {
  index: number
  gasUsed: string
  effectiveGasPrice: string
  functionSelector: `0x${string}`
  functionName: string
  contractAddress: Hex | null
}
