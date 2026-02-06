import { parseAbi } from 'viem'
import { AppClient } from '#app/clients.js'

import { SETTLEMENT_EVENT_EMITTER } from '#app/domain/constants/app.js'

import { handleSettlement } from './settlements/handler.js'
import { ListenerItem } from './types/context.js'

// ------------------
// LISTENERS
// ------------------

export const start = (client: AppClient) => {
  client.watchEvent({
    address: SETTLEMENT_EVENT_EMITTER, // todo: address per chain / client
    events: parseAbi([
      'event Settlement(bytes32 indexed orderHash, address indexed collection, uint256 indexed tokenId, address seller, address buyer, address currency, uint256 price)',
    ]),
    onLogs: logs => {
      logs.forEach(log =>
        routeLog({
          log,
          chainId: client.chain.id,
        })
      )
    },
    onError: error => console.log(error),
  })
  console.log(`Listening for events on chain: ${client.chain!.id}`)
  console.log(`Watching contract: ${SETTLEMENT_EVENT_EMITTER}`)
}

const routers: Record<string, (item: ListenerItem) => void> = {
  Settlement: handleSettlement,
  // OrderCancelled: handleOrderCancelled,
}

const routeLog = (envelope: ListenerItem) => {
  const handler = routers[envelope.log.eventName]
  if (!handler) {
    console.warn(`[indexer] Unhandled event: ${envelope.log.eventName}`)
    return
  }

  handler(envelope)
}
