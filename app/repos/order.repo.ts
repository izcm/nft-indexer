import { Hex } from 'viem'
import { ObjectId } from 'mongodb'

import { FindPageArgs } from '#app/repos/types.js'
import { Order } from '#app/domain/order/types.js'

import { orders } from '#app/db/collections.js'
import { OrderStatus } from '#app/domain/order/types.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'

// TODO: dont use hashOrderStruct => use viem typedData functions or smth similar
export const orderRepo = {
  // === read ===
  async findById(id: ObjectId) {
    return orders().findOne({ _id: id })
  },

  async findByChainIdAndOrderHash(chainId: number, orderHash: Hex) {
    return orders().findOne({ chainId, orderHash })
  },

  async findPage({ filters, from, to, cursor, limit }: FindPageArgs) {
    const createdTs = 'createdAt'
    const { status, ...query } = filters

    if (cursor) {
      const [ts, id] = cursor.split('_')
    }

    const docs = await orders()
      .find(query)
      .sort({ ['order.start']: -1, _id: -1 })
      .limit(limit + 1)
      .toArray()

    let nextCursor: string | null = null

    if (docs.length > limit) {
      const last = docs[limit - 1]
      nextCursor = `${last.createdAt}_${last._id.toString()}`
    }

    return {
      items: docs.slice(0, limit),
      nextCursor,
    }
  },

  // === write ===

  async save(chainId: number, order: Order) {
    const { signature, ...orderCore } = order
    const orderHash = hashOrderStruct(orderCore)

    return orders().insertOne({
      orderHash,
      chainId,
      order: {
        ...orderCore,
        signature,
      },
      status: 'active',
      updatedAt: Date.now(),
      createdAt: Date.now(),
    })
  },

  async updateStatus(chainId: number, orderHash: Hex, status: OrderStatus) {
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
    return orderRepo.findByChainIdAndOrderHash(chainId, orderHash)
  },

  markFilled(orderHash: Hex) {
    return orderRepo.updateStatus(chainId, orderHash, 'filled')
  },

  markCancelled(orderHash: Hex) {
    return orderRepo.updateStatus(chainId, orderHash, 'cancelled')
  },

  markExpired(orderHash: Hex) {
    return orderRepo.updateStatus(chainId, orderHash, 'expired')
  },
})
