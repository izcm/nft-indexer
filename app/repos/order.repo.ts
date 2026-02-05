import { ObjectId } from 'mongodb'

import { FindPageArgs } from '#app/repos/types.js'
import { hashOrderStruct, Order, OrderRecord } from '#app/domain/types/order.js'

import { orderStates, orders, getClient } from '#app/db/mongo.js'
import { Hex } from 'viem'
import { OrderStatus } from '#app/domain/types/order-state.js'

// TODO: dont use hashOrderStruct => use viem typedData functions or smth similar
export const orderRepo = {
  // === read ===
  async findById(id: ObjectId) {
    return orders().findOne({ _id: id })
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

  async findByChainIdAndHash(chainId: number, orderHash: Hex) {
    return orders().findOne({ chainId, orderHash })
  },

  // === write ===

  // --- NB: no order may exist without an orderState      ---
  // --- an orderState may exist without a connected order ---

  async save(chainId: number, order: Order) {
    const client = getClient()
    const session = client.startSession()

    const { signature, ...orderCore } = order
    const orderHash = hashOrderStruct(orderCore)

    let orderId

    try {
      await session.withTransaction(async () => {
        await orderStates().insertOne(
          {
            chainId,
            orderHash: hashOrderStruct(orderCore),
            status: 'active',
            updatedAt: Date.now(),
          },
          { session }
        )

        const res = await orders().insertOne(
          {
            orderHash,
            chainId,
            order: {
              ...orderCore,
              signature,
            },
          },
          { session }
        )
        orderId = res.insertedId
      })
    } finally {
      await session.endSession()
    }

    return orderId
  },

  async updateStatus(chainId: number, orderHash: Hex, status: OrderStatus) {
    await orderStates().updateOne(
      { chainId, orderHash },
      {
        $set: {
          status,
          updatedAt: Date.now(),
        },

        $setOnInsert: {
          chainId,
          orderHash,
        },
      },
      { upsert: true }
    )
  },
}

/**
 * WRAPPER
 * - Prettifies multichain code
 */

export const orderRepoFor = (chainId: number) => ({
  async readState(orderHash: Hex) {
    return orderStates().findOne({ chainId, orderHash })
  },

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
