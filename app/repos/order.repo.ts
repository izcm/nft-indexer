import { ObjectId } from 'mongodb'

import { FindPageArgs } from '#app/repos/types.js'
import { hashOrderStruct, Order, OrderRecord } from '#app/domain/types/order.js'

import { dbOrderStates, dbOrders, getClient } from '#app/db/mongo.js'

// TODO: dont use hashOrderStruct => use viem typedData functions or smth similar
export const orderRepo = {
  // === read ===
  async findById(id: ObjectId) {
    return dbOrders().findOne({ _id: id })
  },

  async findPage({ filters, from, to, cursor, limit }: FindPageArgs) {
    const { status, ...query } = filters

    if (cursor) {
      // todo: implement cursor with some timestamp
      const [ts, id] = cursor.split('_')
    }

    const docs = await dbOrders()
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
        await dbOrderStates().insertOne(
          {
            chainId,
            orderHash: hashOrderStruct(orderCore),
            status: 'active',
            updatedAt: Date.now(),
          },
          { session }
        )

        const res = await dbOrders().insertOne(
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
}
