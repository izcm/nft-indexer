// TODO: https://vitest.dev/config/ **define import aliases in vitest config**
import { describe, expect, it, vi } from 'vitest'

import { SettlementLog } from '#app/listeners/types/logs.js'
import { settlementFromLog } from '#app/listeners/settlements/logic.js'

// test helpers

import {
  mockSettlementLog,
  mockTx,
  mockReceipt,
  mockFill,
  mockOrder,
} from '#tests/mocks/primitives.js'

describe('Settlement log => Settlement domain mapping', () => {
  it('creates a Settlement from a Settlement event log', () => {
    const log = mockSettlementLog()
    const settlement = settlementFromLog(log, 31337)

    // settlement data fields
    const { args } = log

    expect(settlement.chainId).toBe(31337)
    expect(settlement.orderHash).toBe(args.orderHash)

    expect(settlement.collection).toBe(args.collection)
    expect(settlement.tokenId).toBe(args.tokenId.toString())

    expect(settlement.seller).toBe(args.seller)
    expect(settlement.buyer).toBe(args.buyer)

    // chain / execution ctx
    const { execution } = settlement

    expect(execution.logIndex).toBe(Number(log.logIndex))
    expect(execution.txHash).toBe(log.transactionHash)

    const { block } = execution

    expect(block.number).toBe(Number(log.blockNumber))
    expect(block.timestamp).toBe(Number(log.blockTimestamp))

    // ingestion ctx
    expect(settlement.metaStatus).toBe('PENDING')
    expect(settlement.ingestedAt).toBe(0) // set in db

    // order? should be undefined
    expect(settlement.orderAttributes).toBeUndefined()
  })
})
