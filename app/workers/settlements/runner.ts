import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

import type { Abi } from 'viem'
import { AppClient } from '#app/clients.js'

import { settlementMetaFromTx as metaFromTx } from '#app/workers/settlements/logic.js'
import { settlementRepoFor } from '#app/repos/settlement.repo.js'
import { readTxMeta } from '#app/lib/blockchain/calls/tx-meta.js'

export const runSettlementWorker = async (client: AppClient) => {
  const chainId = client.chain.id
  const repo = settlementRepoFor(chainId)

  const pending = await repo.findPendingMeta(25)

  if (pending.length === 0) return

  for (const settlement of pending) {
    const { txHash } = settlement.execution

    try {
      const { receipt, tx } = await readTxMeta(client, txHash)
      const meta = await metaFromTx(tx, receipt, json.abi as Abi)

      await repo.finalizeMeta(settlement.orderHash, meta)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      console.error('[settlement-worker] failed', err)
      await repo.markMetaFailed(settlement.execution.txHash, e.message)
    }
  }
}
