import { Hex } from 'viem'

// covers reverts
// covers validation failures
// covers decoding errors
// covers contract rejects
// not tied to orders only
// still domain-relevant

// short + readable
export type TxFailures = {
  chainId: number
  txHash: Hex
  orderHash: Hex

  reason: 'INVALID_TIMESTAMPS' | 'BAD_SIGNATURE' | 'EXPIRED'

  blockTs: number
}
