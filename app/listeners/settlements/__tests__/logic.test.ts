// TODO: https://vitest.dev/config/ **define import aliases in vitest config**
import { settlementFromLog } from '#app/listeners/settlements/logic.js'
import { fakeSettlementLog } from '#tests/helpers/fixtures.js'
import { describe, expect, it } from 'vitest'

describe('Settlement log => Settlement domain mapping', () => {
  it('creates a Settlement from a Settlement event log', () => {
    const log = fakeSettlementLog()
    const settlement = settlementFromLog(log, 31337)

    // settlement data fields
    const { args } = log

    expect(settlement.chainId).toBe(31337)
    expect(settlement.orderHash).toBe(args.orderHash)

    expect(settlement.collection).toBe(args.collection)
    expect(settlement.tokenId).toBe(args.tokenId.toString())

    expect(settlement.seller).toBe(args.seller)
    expect(settlement.buyer).toBe(args.buyer)

    expect(settlement.ingestedAt).toBe(0) // set in db

    // chain / execution ctx
    const { execution } = settlement

    expect(execution.logIndex).toBe(Number(log.logIndex))
    expect(execution.txHash).toBe(log.transactionHash)

    const { block } = execution

    expect(block.number).toBe(Number(log.blockNumber))
    expect(block.timestamp).toBe(Number(log.blockTimestamp))

    // call reconstruction
    const { callReconstruction } = execution

    expect(callReconstruction.status).toBe('PENDING')
    expect(callReconstruction.data).toBeUndefined()
  })
})
