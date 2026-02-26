import type { OrderCore, OrderRecord } from '#app/domain/order/types.js'
import type { Settlement, SettlementCall } from '#app/domain/settlement/types.js'
import { Status } from '#app/domain/shared/status.js'
import type { Address, Hash } from '#app/domain/shared/eth.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import type { TxContext } from '#app/domain/shared/eth.js'
import type { SettlementLog } from '#app/listeners/settlements/logic.js'
import {
  addrOf,
  bytes32,
  bytes32n,
  bytesOf,
  bytesOfn,
  priceWei,
} from '#app/lib/utils/evm-primitives.js'

const s = (x: number | bigint) => x.toString()

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

export const mockTxContext: TxContext = {
  index: 0,
  gasUsed: s(priceWei('tx-context:gas-used')),
  effectiveGasPrice: s(priceWei('tx-context:gas-price')),
  functionSelector: '0xab12ef34',
  functionName: 'fn',
  contractAddress: addrOf('tx-context:contract'),
}

export const mockTx = (input: Hash) => ({
  to: addrOf('tx:txTo'),
  chainId: 1n,
  transactionIndex: 0n,
  input,
})

/* -------------------------------------------------
   Domain helpers
--------------------------------------------------- */

export const mockFill = () => ({
  tokenId: s(bytes32n('fill:tokenId')),
  actor: addrOf('fill:actor'),
})

export const mockOrderRecord = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  chainId: 1,
  orderHash: hashOrderStruct(mockOrderCore()),
  order: {
    ...mockOrderCore(),
    signature: {
      r: '0xabc',
      s: '0xabc',
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
  tokenId: s(bytes32n('order:tokenId')),
  currency: addrOf('order:currency') as Address,
  price: s(bytes32n('order:price')),
  actor: addrOf('order:actor') as Address,
  start: s(bytesOfn('order:start', 8)),
  end: s(bytesOfn('order:end', 8)),
  nonce: s(bytes32n('order:nonce')),
})

export const mockSettlement = (overrides: Partial<Settlement> = {}): Settlement => ({
  chainId: 1,
  orderHash: bytes32('settlement:orderHash') as Hash,
  collection: addrOf('settlement:collection') as Address,
  tokenId: s(bytes32n('settlement:tokenId')),
  seller: addrOf('settlement:seller') as Address,
  buyer: addrOf('settlement:buyer') as Address,
  currency: addrOf('settlement:currency') as Address,
  price: s(bytes32n('settlement:price')),
  execution: {
    logIndex: 0,
    txHash: bytes32('settlement:txHash') as Hash,
    block: {
      number: 0,
      timestamp: 0,
    },
    callReconstruction: {
      status: Status.PENDING,
    },
  },
  ingestedAt: 0,
  ...overrides,
})

export const mockSettlementCall = (overrides: Partial<SettlementCall> = {}): SettlementCall => ({
  txContext: mockTxContext,
  txInput: {
    order: mockOrderCore(),
    signature: {
      r: '0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca' as Hash,
      s: '0xabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca' as Hash,
      v: 27,
    },
    fill: mockFill(),
    signer: addrOf('settlement:signer') as Address,
  },
  ...overrides,
})

export const mockSettlementLog = (): SettlementLog => ({
  eventName: 'Settlement',
  args: {
    orderHash: bytes32('cd') as Hash,
    collection: addrOf('log:collection') as Address,
    tokenId: BigInt(bytes32('log:tokenId')),
    currency: addrOf('log:currency') as Address,
    price: BigInt(bytes32('log:price')),
    seller: addrOf('log:seller') as Address,
    buyer: addrOf('log:buyer') as Address,
  },
  blockNumber: bytes32n('log:blocknumber'),
  blockTimestamp: bytes32n('log:blocktimestamp'),
  transactionHash: bytes32('log:txhash') as Hash,
  logIndex: bytes32n('log:index'),
})
