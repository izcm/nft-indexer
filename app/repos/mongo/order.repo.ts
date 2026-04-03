import { nfts, orders } from '#app/db/collections.js'

import type { Order, OrderKey, OrderStatus } from '#app/domain/order/model.js'
import type { OrderPort } from '#app/domain/order/port.js'
import type { Address, ChainEvent, Hash } from '#app/domain/shared/types/eth.js'

import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import { OrderDoc } from './docs.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

const baseRead = makeReadRepo<OrderDoc, OrderKey>(orders, k => ({
  chainId: k.chainId,
  orderHash: k.orderHash,
}))

const write = makeTsWrite(orders)

export const orderRepo: OrderPort = {
  // === read ===
  ...baseRead,

  // === write ===
  async ensure(chainId: number, order: Order) {
    const { signature, ...orderCore } = order
    const orderHash = hashOrderStruct(orderCore) // todo: move this out of repo

    const { collection, tokenId } = orderCore

    const nft = await nfts().findOne({
      chainId,
      collection,
      tokenId,
    })

    const now = Date.now()

    const res = await write.updateOne(
      { chainId, orderHash },
      {
        $setOnInsert: {
          orderHash,
          chainId,
          order: {
            ...orderCore,
            signature,
          },
          status: 'active',

          // nft attributes for pagination filters
          attributes: nft?.attributes ?? null,
        },
      },
      { upsert: true }
    )

    const didUpsert = !!res.upsertedCount

    return { chainId, orderHash, didUpsert }
  },

  async cancelOrdersByChainIdNonce({
    chainId,
    user,
    nonce,
    cancellation,
  }: {
    chainId: number
    user: Address
    nonce: string
    cancellation: ChainEvent
  }): Promise<{ orderHash: Hash }[]> {
    const filter = { chainId, 'order.actor': user, 'order.nonce': nonce }

    const docs = await orders().find(filter).project({ orderHash: 1 }).toArray()

    await write.updateMany(filter, {
      $set: {
        status: 'cancelled',
        chainEvent: cancellation,
      },
    })

    return docs.map(d => ({
      orderHash: d.orderHash,
    }))
  },

  async markOrderFilled({
    chainId,
    orderHash,
    chainEvent,
  }: {
    chainId: number
    orderHash: Hash
    chainEvent: ChainEvent
  }): Promise<void> {
    await write.updateOne(
      { chainId, orderHash },
      { $set: { status: 'filled', chainEvent: chainEvent } }
    )
  },

  async updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }) {
    await write.updateOne(
      { chainId, orderHash },
      {
        $set: {
          status,
        },
      }
    )
  },
}

/**
 * OPTIONAL WRAPPER
 * - Prettifies multichain code
 */
export const orderRepoFor = (chainId: number) => ({
  findByKey(orderHash: Hash) {
    return orderRepo.findByKey({ chainId, orderHash })
  },

  markFilled(orderHash: Hash) {
    return orderRepo.updateStatus({ chainId, orderHash, status: 'filled' })
  },

  markCancelled(orderHash: Hash) {
    return orderRepo.updateStatus({ chainId, orderHash, status: 'cancelled' })
  },

  markExpired(orderHash: Hash) {
    return orderRepo.updateStatus({ chainId, orderHash, status: 'expired' })
  },
})
