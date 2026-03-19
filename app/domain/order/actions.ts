import { isValidOrder } from './rules.js'
import type { Order, OrderKey } from './model.js'
import type { OrderPort } from './port.js'

import type { NFTCollectionKey } from '../nft-collection/model.js'
import type { NFTCollectionPort } from '../nft-collection/port.js'

import type { RealtimePort } from '../shared/interfaces/realtime-port.js'
import { InvalidOrderError } from '../shared/errors.js'
import { Address } from '../shared/types/eth.js'

const TAG = 'order'

type Deps = {
  orders: Pick<OrderPort, 'ensure'>
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

  // --- secondary actions ---

  function onOrderCreated({ chainId, orderHash, address }: OrderKey & { address: Address }) {
    void nftCollections
      .noteNFTCollection({ chainId, address })
      ?.catch(err => console.error(`[${TAG}:created] failed to note NFT collection`, err))

    realtime?.broadcast('order.created', { chainId, orderHash })
  }

  return { ingestOrder }
}
