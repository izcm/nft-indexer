import json from '@a2zb/abis/dmrkt/OrderEngine.json' with { type: 'json' }
import type { Abi } from 'viem'

import type { AppClient } from '#app/clients.js'
import { settlementActions } from '#app/di/write.js'

import { readTxMeta } from '#app/lib/blockchain/calls/tx-meta.js'

import type { SettlementPort } from '#app/domain/settlement/port.js'

import { decodeSettlementCall } from './logic.js'

export async function runSettlementCallReconstructionWorker(
  client: AppClient,
  port: SettlementPort,
  marketplaceAddr: `0x${string}`
) {
  const chainId = client.chain.id

  const pending = await port.findPendingCallReconstruction(chainId, 25)

  if (pending.length === 0) return

  for (const settlement of pending) {
    const { orderHash } = settlement

    try {
      const { txHash } = settlement.execution

      const { receipt, tx } = await readTxMeta(client, txHash)
      const call = await decodeSettlementCall(
        tx,
        receipt,
        json.abi as Abi,
        BigInt(chainId),
        marketplaceAddr
      )

      await settlementActions.ingestReconstructedCall({
        chainId,
        orderHash,
        call,
      })
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))

      console.error('[settlement-worker] failed', err)

      await port.markCallReconstructionFailed({ chainId, orderHash, error: e.message })
    }
  }
}
