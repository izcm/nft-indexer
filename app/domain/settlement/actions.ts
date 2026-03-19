import type { Settlement, SettlementKey, SettlementCall } from './model.js'
import type { SettlementPort } from './port.js'

import type { OrderPort } from '../order/port.js'
import type { NFTCollectionPort } from '../nft-collection/port.js'

import type { Address } from '../shared/types/eth.js'
import type { RealtimePort } from '../shared/interfaces/realtime-port.js'

const TAG = 'settlement'

type Deps = {
  settlements: Pick<SettlementPort, 'save' | 'finalizeCallReconstruction'>
  orders: Pick<OrderPort, 'findByKey' | 'updateStatus'>
  nftCollections: Pick<NFTCollectionPort, 'noteNFTCollection'>
  realtime?: RealtimePort
}

export const makeSettlementActions = ({ settlements, orders, nftCollections, realtime }: Deps) => {
  // --- primary actions ---

  async function ingestSettlement(settlement: Settlement) {
    await settlements.save(settlement)

    const { chainId, orderHash, collection } = settlement
    void onSettlementCreated({ chainId, orderHash, collection })
  }

  async function ingestSettlementMeta({
    chainId,
    orderHash,
    meta,
  }: SettlementKey & { meta: SettlementCall }) {
    try {
      await settlements.finalizeCallReconstruction({ chainId, orderHash, meta })

      // corresponding order for settlement is a 'nice to have'
      //  => fire and forget
      // orderRepo.ensure(chainId, ) // **feature on pause**
    } catch (err) {
      throw new Error(`[${TAG}:meta] failed to finalize settlement metadata`, { cause: err })
    }
  }

  // --- secondary actions ---

  function onSettlementCreated({
    chainId,
    orderHash,
    collection,
  }: SettlementKey & { collection: Address }) {
    const tag = `${TAG}:created`

    // note collection
    void nftCollections
      .noteNFTCollection({ chainId, address: collection })
      ?.catch(err => console.error(`[${tag}] failed to note NFT collection`, err))

    // mark order as filled
    const orderKey = { chainId, orderHash }

    void orders
      .findByKey(orderKey)
      .then(order => {
        if (!order) return
        return orders.updateStatus({ ...orderKey, status: 'filled' })
      })
      .catch(err => console.error(`[${tag}] failed to mark order as filled`, err))

    // realtime (eg. websocket)
    realtime?.broadcast('settlement.created', { chainId, orderHash })
  }

  return { ingestSettlement, ingestSettlementMeta }
}
