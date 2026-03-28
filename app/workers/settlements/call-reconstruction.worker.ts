import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }
import type { Abi } from 'viem'

import { AppClient } from '#app/clients.js'
import { readTxMeta } from '#app/lib/blockchain/calls/tx-meta.js'
import { type SettlementPort, settlementRepoForChain } from '#app/domain/settlement/port.js'

import { decodeSettlementCall } from './logic.js'

export async function runSettlementCalReconstructionWorker(
  client: AppClient,
  port: SettlementPort
) {
  const chainId = client.chain.id
  const settlements = settlementRepoForChain(chainId, port)

  const pending = await settlements.findPendingCallReconstruction(25)

  if (pending.length === 0) return

  for (const settlement of pending) {
    const { txHash } = settlement.execution

    try {
      const { receipt, tx } = await readTxMeta(client, txHash)
      const call = await decodeSettlementCall(tx, receipt, json.abi as Abi)

      await settlements.finalizeCallReconstruction(settlement.orderHash, call)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))

      console.error('[settlement-worker] failed', err)

      await settlements.markCallReconstructionFailed(settlement.execution.txHash, e.message)
    }
  }
}
