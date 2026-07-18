import { isValidOrder } from './rules.js'
import type { Order, OrderKey } from './model.js'
import type { OrderPort } from './port.js'

import type { NFTCollectionPort } from '../nft-collection/port.js'

import type { RealtimePort } from '../shared/interfaces/realtime-port.js'
import type { Address, ChainEvent } from '../shared/types/eth.js'
import { InvalidOrderError } from '../shared/errors.js'

const TAG = 'order'

type Deps = {
  orders: Pick<OrderPort, 'ensure' | 'cancelOrdersByChainIdNonce' | 'count'>
  nftCollections: Pick<NFTCollectionPort, 'noteNFTCollection' | 'count' | 'findByKey'>
  realtime?: RealtimePort
}

export const makeOrderActions = ({ orders, nftCollections, realtime }: Deps) => {
  // --- primary actions ---

  async function ingestOrder(chainId: number, order: Order) {
    // temporary rule for testnet deployment:
    // -> only allow orders on a collection that is already stored in db.
    // -> skip if there isnt any nftcollections in db
    // (only one demo collection is live per now) tmp: very strict one collection only
    if (
      (await nftCollections.count()) > 0 // && // if 'nft-collections' doument count > 0
      // !nftCollections.findByKey({ chainId, address: order.collection }) // and order.collection isn't in db
    ) {
      throw new InvalidOrderError('Collection not supported.') // reject
    }

    if ((await orders.count()) > 10_000) throw new Error('Order cap reached.')

    // real rules from here
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
