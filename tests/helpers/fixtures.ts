import type { OrderCore, OrderRecord } from '#app/domain/order/model.js'
import type { Settlement, SettlementCall } from '#app/domain/settlement/model.js'
import { Status } from '#app/domain/shared/status.js'
import type { Address, Hash } from '#app/domain/shared/types/eth.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import type { TxContext } from '#app/domain/shared/types/eth.js'
import type { SettlementLog } from '#app/listeners/settlements/from-log.js'
import {
  addrOf,
  bytes32,
  bytes32n,
  bytesOf,
  bytesOfn,
  priceWei,
} from '#tests/helpers/evm-fixtures.js'

const s = (x: number | bigint) => x.toString()

/* -------------------------------------------------
   Primitive identities
--------------------------------------------------- */

export const fakePrivateKeys = {
  signer: bytes32('pk:signer'),
} as const

/* -------------------------------------------------
   Chain context
--------------------------------------------------- */

export const fakeReceipt = {
  gasUsed: bytes32('receipt:used'),
  effectiveGasPrice: bytes32('receipt:price'),
} as const

export const fakeTxContext: TxContext = {
  index: 0,
  gasUsed: s(priceWei('tx-context:gas-used')),
  effectiveGasPrice: s(priceWei('tx-context:gas-price')),
  functionSelector: '0xab12ef34',
  functionName: 'fn',
  contractAddress: addrOf('tx-context:contract'),
}

export const fakeTx = (input: Hash) => ({
  to: addrOf('tx:txTo'),
  chainId: 1n,
  transactionIndex: 0n,
  input,
})

/* -------------------------------------------------
   Domain helpers
--------------------------------------------------- */

export const fakeFill = () => ({
  tokenId: s(bytes32n('fill:tokenId')),
  actor: addrOf('fill:actor'),
})

export const fakeOrderRecord = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
  chainId: 1,
  orderHash: hashOrderStruct(fakeOrderCore()),
  order: {
    ...fakeOrderCore(),
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

export const fakeOrderCore = (): OrderCore => ({
  side: 0,
  isCollectionBid: false,
  collection: addrOf('order:collection'),
  tokenId: s(bytes32n('order:tokenId')),
  currency: addrOf('order:currency') as Address,
  price: s(priceWei('order:price')),
  actor: addrOf('order:actor') as Address,
  start: s(bytesOfn('order:start', 8)),
  end: s(bytesOfn('order:end', 8)),
  nonce: s(bytes32n('order:nonce')),
})

export const fakeSettlement = (overrides: Partial<Settlement> = {}): Settlement => ({
  chainId: 1,
  orderHash: bytes32('settlement:orderHash') as Hash,
  collection: addrOf('settlement:collection') as Address,
  tokenId: s(bytes32n('settlement:tokenId')),
  seller: addrOf('settlement:seller') as Address,
  buyer: addrOf('settlement:buyer') as Address,
  currency: addrOf('settlement:currency') as Address,
  price: s(priceWei('order:price')),
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
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

export const fakeSettlementCall = (overrides: Partial<SettlementCall> = {}): SettlementCall => ({
  txContext: fakeTxContext,
  txInput: {
    order: fakeOrderCore(),
    fill: fakeFill(),
    signer: addrOf('settlement:signer') as Address,
  },
  ...overrides,
})

export const fakeSettlementLog = (): SettlementLog => ({
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
