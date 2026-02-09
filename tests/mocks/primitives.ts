import type { Hex } from 'viem'

import { OrderCore } from '#app/domain/order/types.js'
import { SettlementLog } from '#app/listeners/types/logs.js'

import { addrOf, bytes32, bytes32n, bytesOf } from '../helpers/hash.js'

/* -------------------------------------------------
   Primitive identities
--------------------------------------------------- */

export const mockPrivateKeys = {
  signer: bytes32('pk:signer'),
} as const

/* -------------------------------------------------
   Chain context
--------------------------------------------------- */

export const mockTx = (input: Hex) => ({
  to: addrOf('tx:txTo'),
  chainId: 1n,
  transactionIndex: 0n,
  input,
})

export const mockReceipt = {
  gasUsed: bytes32('receipt:used'),
  effectiveGasPrice: bytes32('receipt:price'),
} as const

/* -------------------------------------------------
   Domain helpers
--------------------------------------------------- */

export const mockFill = () => ({
  tokenId: bytes32n('fill:tokenId'),
  actor: addrOf('fill:actor'),
})

export const mockOrderCore = (): OrderCore => ({
  side: 0,
  isCollectionBid: false,
  collection: addrOf('order:collection'),
  tokenId: bytes32('order:tokenId'),
  currency: addrOf('order:currency'),
  price: bytes32('order:price'),
  actor: addrOf('order:actor'),
  start: bytesOf('order:start', 8),
  end: bytesOf('order:end', 8),
  nonce: bytes32('order:nonce'),
})

export const mockSettlementLog = (): SettlementLog => {
  return {
    eventName: 'Settlement',
    args: {
      orderHash: bytes32('cd'),
      collection: addrOf('log:collection'),
      tokenId: BigInt(bytes32('log:tokenId')),
      currency: addrOf('log:currency'),
      price: BigInt(bytes32('log:price')),
      seller: addrOf('log:seller'),
      buyer: addrOf('log:buyer'),
    },
    blockNumber: bytes32n('log:blocknumber'),
    blockTimestamp: bytes32n('log:blocktimestamp'),
    transactionHash: bytes32('log:txhash'),
    logIndex: bytes32n('log:index'),
  }
}
