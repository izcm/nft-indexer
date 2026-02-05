import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

import type { Abi } from 'viem'

import { AppClient } from '#app/chain/clients.js'

import { getTxMeta } from '#app/chain/calls/tx-meta.js'

import { settlementMetaFromTx as metaFromTx } from '#app/workers/settlements/logic.js'
import { settlementRepoFor } from '#app/repos/settlement.repo.js'
import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'

export const runSettlementWorker = async (client: AppClient) => {
  const chainId = client.chain.id
  const repo = settlementRepoFor(chainId)

  const pending = await repo.findPendingMeta(25)

  if (pending.length === 0) return

  for (const s of pending) {
    const { txHash } = s.execution

    try {
      const { receipt, tx } = await getTxMeta(client, txHash)
      const meta = await metaFromTx(tx, receipt, json.abi as Abi)

      // 1. get order:
      // - find settlement by chainId + txHash
      // - pass .orderHash to stats repo
      // void statsRepo.recordOrderFilled({ chainId })

      // 2. find orderState
      // -  by chainId + .orderHash
      // - set status: filled

      await repo.finalizeMeta(txHash, meta)
    } catch (err: any) {
      console.log('[meta-worker] failed for ', s._id, err.message)
      await repo.markMetaFailed(s.execution.txHash, err.message)
    }
  }
}
