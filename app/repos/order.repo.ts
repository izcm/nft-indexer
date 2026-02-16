import { Hex } from 'viem'
import { ObjectId } from 'mongodb'

import { FindPageArgs } from '#app/repos/_shared/types.js'
import { Order } from '#app/domain/order/types.js'

import { orders } from '#app/db/collections.js'
import { OrderStatus } from '#app/domain/order/types.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'

type OrderKey = {
  chainId: number
  orderHash: Hex
}

export const orderRepo = {
  // === read ===
  async findById(id: ObjectId) {
    return orders().findOne({ _id: id })
  },

  async findByOrderKey(key: OrderKey) {
    const { chainId, orderHash } = key
    return orders().findOne({ chainId, orderHash })
  },

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
    const didUpsert = doc.createdAt === now

    return { id, didUpsert }
  },

  async updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }) {
    return orders().updateOne(
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
  findByHash(orderHash: Hex) {
    return orderRepo.findByOrderKey({ chainId, orderHash })
  },

  markFilled(orderHash: Hex) {
    return orderRepo.updateStatus({ chainId, orderHash, status: 'filled' })
  },

  markCancelled(orderHash: Hex) {
    return orderRepo.updateStatus({ chainId, orderHash, status: 'cancelled' })
  },

  markExpired(orderHash: Hex) {
    return orderRepo.updateStatus({ chainId, orderHash, status: 'expired' })
  },
})
