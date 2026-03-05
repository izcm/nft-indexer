import { isValidOrder } from './rules.js'
import type { Order } from './model.js'
import type { OrderPort } from './port.js'

import type { NFTCollectionKey } from '../nft-collection/model.js'
import type { NFTCollectionPort } from '../nft-collection/port.js'

import { InvalidOrderError } from '../shared/errors.js'

const TAG = 'order'

type Deps = {
  orders: OrderPort
  nftCollections: NFTCollectionPort
}

export const makeOrderActions = ({ orders, nftCollections }: Deps) => {
  // --- primary actions ---

  async function ingestOrder(chainId: number, order: Order) {
    if (!isValidOrder(order)) {
      throw new InvalidOrderError()
    }

    const { id, didUpsert } = await orders.ensure(chainId, order)

    void onOrderCreated({ chainId, address: order.collection })

    return { id, didUpsert }
  }

  // --- secondary actions ---

  function onOrderCreated({ chainId, address }: NFTCollectionKey) {
    void nftCollections
      .noteNFTCollection({ chainId, address })
      ?.catch(err => console.error(`[${TAG}:created] failed to note NFT collection`, err))
  }

  return { ingestOrder }
}
