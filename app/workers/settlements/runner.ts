import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

import type { Abi } from 'viem'
import { AppClient } from '#app/chain/clients.js'

import { getTxMeta } from '#app/chain/calls/tx-meta.js'
import { settlementMetaFromTx as metaFromTx } from '#app/workers/settlements/logic.js'

import { settlementRepoFor } from '#app/repos/settlement.repo.js'
import { applySettlementMeta as applyMeta } from '#app/domain/actions/settlement/apply-meta.js'

export const runSettlementWorker = async (client: AppClient) => {
  const chainId = client.chain.id
  const repo = settlementRepoFor(chainId)

  const pending = await repo.findPendingMeta(25)

  if (pending.length === 0) return

  for (const settlement of pending) {
    const { txHash } = settlement.execution

    try {
      const { receipt, tx } = await getTxMeta(client, txHash)
      const meta = await metaFromTx(tx, receipt, json.abi as Abi)

      await applyMeta(settlement, meta)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      console.error('[settlement-worker] failed', err)
      await repo.markMetaFailed(settlement.execution.txHash, e.message)
    }
  }
}
