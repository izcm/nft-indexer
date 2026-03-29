import { Hash } from '#app/domain/shared/types/eth.js'

export type ListenerItem = {
  log: any // decoded viem log
  chainId: number
}

export type BaseLog = {
  blockNumber: bigint
  blockTimestamp: bigint
  transactionHash: Hash
  logIndex: bigint
}
