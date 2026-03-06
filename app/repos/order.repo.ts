import { ObjectId, WithId } from 'mongodb'
import { orders } from '#app/db/collections.js'

import type { Order, OrderKey, OrderRecord, OrderStatus } from '#app/domain/order/model.js'
import type { OrderPort } from '#app/domain/order/port.js'
import type { Hash } from '#app/domain/shared/types/eth.js'

import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'

import { makeReadRepo } from './read-commons.repo.js'

const baseRead = makeReadRepo<OrderRecord, OrderKey>(orders, k => ({
  chainId: k.chainId,
  orderHash: k.orderHash,
}))

export const orderRepo: OrderPort = {
  // === read ===
  ...baseRead,

  // === write ===

  async ensure(chainId: number, order: Order) {
    const { signature, ...orderCore } = order
    const orderHash = hashOrderStruct(orderCore)

    const now = Date.now()

    const res = await orders().findOneAndUpdate(
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
          createdAt: now,
          updatedAt: now, // updatedAt only updates when order.status is modified
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      }
    )

    const doc = res.value!

    const id = doc._id
    const didUpsert = res.lastErrorObject?.updatedExisting === false

    return { id, didUpsert }
  },

  async updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }) {
    await orders().updateOne(
      { chainId, orderHash },
      {
        $set: {
          status,
          updatedAt: Date.now(),
        },
      }
    )
  },
}

/**
 * WRAPPER
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
