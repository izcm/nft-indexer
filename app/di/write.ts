import { WebSocketServer } from 'ws'

import { orderRepo } from '#app/repos/mongo/order.repo.js'
import { nftCollectionRepo } from '#app/repos/mongo/nft-collection.repo.js'
import { nftRepo } from '#app/repos/mongo/nft.repo.js'
import { settlementRepo } from '#app/repos/mongo/settlement.repo.js'

import { makeOrderActions } from '#app/domain/order/actions.js'
import { makeSettlementActions } from '#app/domain/settlement/actions.js'
import { makeNFTActions } from '#app/domain/nft/actions.js'
import { makeNFTCollectionActions } from '#app/domain/nft-collection/actions.js'
import { RealtimePort } from '#app/domain/shared/interfaces/realtime-port.js'

// --- web socket ---

const wss = new WebSocketServer({ port: 5001 })

wss.on('error', err => {
  console.error('WebSocket server error:', err)
  process.exit(1)
})

wss.on('connection', function connection(ws) {
  ws.on('error', function (error) {
    this.close()
    console.error(error)
  })
})

const realtime: RealtimePort = {
  broadcast(event, payload) {
    const msg = JSON.stringify({ event, payload })

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  },
}

// --- inject actions ---

export const orderActions = makeOrderActions({
  orders: orderRepo,
  nftCollections: nftCollectionRepo,
  realtime,
})

export const settlementActions = makeSettlementActions({
  settlements: settlementRepo,
  orders: orderRepo,
  nftCollections: nftCollectionRepo,
  realtime,
})

export const nftActions = makeNFTActions({ nfts: nftRepo })

export const nftCollectionActions = makeNFTCollectionActions({ nftCollections: nftCollectionRepo })
