import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

import type { Abi, Hex } from 'viem'

// db and rpc stuff
import { settlementRepo as repo } from '#app/repos/settlement.repo.js'
import { getTxMeta } from '#app/chain/calls/tx-meta.js'

import { ListenerItem } from '../types/context.js'

// logic
import { settlementFromLog as fromLog } from './logic.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = fromLog(item.log, item.chainId)
  repo.save(settlement)

  // void enrich(item.chainId, item.log.transactionHash)
}

// const enrich = async (chainId: number, txHash: Hex) => {
//   const { receipt, tx } = await getTxMeta(chainId, txHash)
//   const meta = await metaFromTx(tx, receipt, json.abi as Abi)
//   await repo.updateWithMeta(txHash, meta)
// }
