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

  async findByChainIdAndHash(chainId: number, orderHash: Hex) {
    return orders().findOne({ chainId, orderHash })
  },

  async findPage({ filters, from, to, cursor, limit }: FindPageArgs) {
    const { status, ...query } = filters

    if (cursor) {
      // todo: implement cursor with some timestamp
      const [ts, id] = cursor.split('_')
    }

    const docs = await orders()
      .find(query)
      // .sort({ [blockTs]: -1, _id: -1 })
      .limit(limit + 1)
      .toArray()

    let nextCursor: string | null = null

    // if (docs.length > limit) {
    //   const last = docs[limit - 1]
    //   nextCursor = `${last.execution.block.timestamp}_${last._id.toString()}`
    // }

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
  async findByHash(orderHash: Hex) {
    return orderRepo.findByChainIdAndHash(chainId, orderHash)
  },

  async markFilled(orderHash: Hex) {
    await orderRepo.updateStatus(chainId, orderHash, 'filled')
  },

  async markCancelled(orderHash: Hex) {
    await orderRepo.updateStatus(chainId, orderHash, 'cancelled')
  },

  async markExpired(orderHash: Hex) {
    await orderRepo.updateStatus(chainId, orderHash, 'expired')
  },
})
