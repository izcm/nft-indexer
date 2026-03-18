import { orders } from '#app/db/collections.js'

import type { Order, OrderKey, OrderRecord, OrderStatus } from '#app/domain/order/model.js'
import type { OrderPort } from '#app/domain/order/port.js'
import type { Hash } from '#app/domain/shared/types/eth.js'

import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

const baseRead = makeReadRepo<OrderRecord, OrderKey>(orders, k => ({
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
    const orderHash = hashOrderStruct(orderCore)

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
        },
      },
      { upsert: true }
    )

    const didUpsert = !!res.upsertedCount

    return { chainId, orderHash, didUpsert }
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
