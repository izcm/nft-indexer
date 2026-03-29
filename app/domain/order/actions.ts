import { isValidOrder } from './rules.js'
import type { Order, OrderKey } from './model.js'
import type { OrderPort } from './port.js'

import type { NFTCollectionPort } from '../nft-collection/port.js'

import type { RealtimePort } from '../shared/interfaces/realtime-port.js'
import type { Address, ChainEvent } from '../shared/types/eth.js'
import { InvalidOrderError } from '../shared/errors.js'

const TAG = 'order'

type Deps = {
  orders: Pick<OrderPort, 'ensure' | 'cancelOrdersByChainIdNonce'>
  nftCollections: Pick<NFTCollectionPort, 'noteNFTCollection'>
  realtime?: RealtimePort
}

export const makeOrderActions = ({ orders, nftCollections, realtime }: Deps) => {
  // --- primary actions ---

  async function ingestOrder(chainId: number, order: Order) {
    if (!isValidOrder(order)) {
      throw new InvalidOrderError()
    }

    const res = await orders.ensure(chainId, order)

    void onOrderCreated({
      chainId: res.chainId,
      orderHash: res.orderHash,
      address: order.collection,
    })

    return { chainId: res.chainId, orderHash: res.orderHash, didUpsert: res.didUpsert }
  }

  async function applyOrderCancelled({
    chainId,
    user,
    nonce,
    cancellation,
  }: {
    chainId: number
    user: Address
    nonce: string
    cancellation: ChainEvent
  }) {
    const cancelled = await orders.cancelOrdersByChainIdNonce({
      chainId,
      user,
      nonce,
      cancellation,
    })

    cancelled.forEach(({ orderHash }) =>
      realtime?.broadcast('order.cancelled', { chainId, orderHash })
    )
  }

  // --- secondary actions ---

  function onOrderCreated({ chainId, orderHash, address }: OrderKey & { address: Address }) {
    void nftCollections
      .noteNFTCollection({ chainId, address })
      ?.catch(err => console.error(`[${TAG}:created] failed to note NFT collection`, err))

    realtime?.broadcast('order.created', { chainId, orderHash })
  }

  return { ingestOrder, applyOrderCancelled }
}
