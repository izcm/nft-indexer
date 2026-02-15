import type { Hex } from 'viem'

import { OrderCore, OrderRecord } from '#app/domain/order/types.js'
import { Settlement } from '#app/domain/settlement/types.js'
import { SettlementLog } from '#app/listeners/types/logs.js'

import { addrOf, bytes32, bytes32n, bytesOf, priceWei } from '../../app/lib/utils/evm-primitives.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'

/* -------------------------------------------------
   Primitive identities
--------------------------------------------------- */

export const mockPrivateKeys = {
  signer: bytes32('pk:signer'),
} as const

/* -------------------------------------------------
   Chain context
--------------------------------------------------- */

export const mockReceipt = {
  gasUsed: bytes32('receipt:used'),
  effectiveGasPrice: bytes32('receipt:price'),
} as const

export const mockTx = (input: Hex) => ({
  to: addrOf('tx:txTo'),
  chainId: 1n,
  transactionIndex: 0n,
  input,
})

/* -------------------------------------------------
   Domain helpers
--------------------------------------------------- */

export const mockFill = () => ({
  tokenId: bytes32n('fill:tokenId'),
  actor: addrOf('fill:actor'),
})

export const mockOrderRecord = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  chainId: 1,
  orderHash: hashOrderStruct(mockOrderCore()),
  order: {
    ...mockOrderCore(),
    signature: {
      r: '0xabc' as Hex,
      s: '0xabc' as Hex,
      v: 27,
    },
  },
  status: 'active' as const,
  updatedAt: 0,
  createdAt: 0,
  ...overrides,
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

export const mockSettlement = (overrides: Partial<Settlement>): Settlement => ({
  chainId: 1,
  orderHash: bytes32('settlement:orderHash'),
  collection: addrOf('settlement:collection'),
  tokenId: bytes32n('settlement:tokenId').toString(),
  seller: addrOf('settlement:seller'),
  buyer: addrOf('settlement:buyer'),
  currency: addrOf('settlement:currency'),
  price: priceWei('settlement:price').toString(),
  execution: {
    logIndex: 0,
    txHash: bytes32('settlement:txHash'),
    block: {
      number: 0,
      timestamp: 0,
    },
  },
  metaStatus: 'PENDING',
  ingestedAt: 0,
  ...overrides,
})

export const mockSettlementLog = (): SettlementLog => ({
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
})
