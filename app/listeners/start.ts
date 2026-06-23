import json from '@a2zb/abis/dmrkt/OrderEngine.json' with { type: 'json' }

import type { ChainClient } from '#app/clients.js'

import { handleSettlement } from './settlements/handler.js'
import { handleOrderCancelled } from './order-cancelled/handler.js'
import { ListenerItem } from './shared/types.js'

// ------------------
// LISTENERS
// ------------------

export const start = ({ client, marketplaceAddr }: ChainClient) => {
  const watch = () =>
    client.watchContractEvent({
      address: marketplaceAddr,
      abi: json.abi,
      onLogs: logs => logs.forEach(log => routeLog({ log, chainId: client.chain.id })),
      onError: error => {
        console.error('[indexer] watcher error, restarting', error)
        setTimeout(watch, 2_000)
      },
    })

  watch()
}

const routers: Record<string, (item: ListenerItem) => Promise<void>> = {
  Settlement: handleSettlement,
  OrderCancelled: handleOrderCancelled,
}

const routeLog = async (envelope: ListenerItem) => {
  const handler = routers[envelope.log.eventName]
  if (!handler) return

  try {
    await handler(envelope)
  } catch (err) {
    console.error('[indexer] handler failed', {
      event: envelope.log.eventName,
      txHash: envelope.log.transactionHash,
      chainId: envelope.chainId,
      err,
    })
  }
}
