import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

import type { Abi } from 'viem'

import { AppClient } from '#app/rpc/clients.js'

import { getTxMeta } from '#app/rpc/tx-meta.js'

import { settlementMetaFromTx as metaFromTx } from '#app/workers/settlements/logic.js'
import { settlementRepo as repo } from '#app/repos/settlement.repo.js'

export const runSettlementWorker = async (client: AppClient) => {
  const chainId = client.chain.id
  const pending = await repo.findPendingMeta(25)

  if (pending.length === 0) return

  for (const s of pending) {
    try {
      const txHash = s.execution.txHash

      const { receipt, tx } = await getTxMeta(client, txHash)

      const meta = await metaFromTx(tx, receipt, json.abi as Abi)

      await repo.finalizeWithMeta(chainId, txHash, meta)
    } catch (err: any) {
      console.log('[meta-worker] failed for ', s._id, err.message)
      await repo.markMetaFailed(chainId, s.execution.txHash, err.message)
    }
  }
}
