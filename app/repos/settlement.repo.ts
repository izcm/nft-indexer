import { Hex } from 'viem'
import { ObjectId } from 'mongodb'

import { dbSettlements, dbOrderStates } from '#app/db/mongo.js'

import { COLLECTIONS } from '#app/domain/constants/db.js'

import { Settlement, SettlementMeta } from '#app/domain/types/settlement.js'
import { FindPageArgs } from '#app/repos/types.js'

import { OrderState } from '#app/domain/types/order-state.js'

// === helpers ===

export const settlementRepo = {
  // === read ===
  async findById(id: ObjectId) {
    return dbSettlements().findOne({ _id: id })
  },

  async findPage({ filters, from, to, cursor, limit }: FindPageArgs) {
    const blockTs = 'execution.block.timestamp'
    const query = { ...filters }

    if (from || to) {
      query[blockTs] = {}
      if (from) query[blockTs].$gte = from
      if (to) query[blockTs].$lte = to
    }

    if (cursor) {
      const [ts, id] = cursor.split('_')

      query.$and = [
        {
          $or: [
            { [blockTs]: { $lt: Number(ts) } },
            { [blockTs]: Number(ts), _id: { $lt: new ObjectId(id as string) } },
          ],
        },
      ]
    }

    const docs = await dbSettlements()
      .find(query)
      .sort({ [blockTs]: -1, _id: -1 })
      .limit(limit + 1)
      .toArray()

    let nextCursor: string | null = null

    if (docs.length > limit) {
      const last = docs[limit - 1]
      nextCursor = `${last.execution.block.timestamp}_${last._id.toString()}`
    }

    return {
      items: docs.slice(0, limit),
      nextCursor,
    }
  },

  async findPendingMeta(limit: number) {
    return dbSettlements().find({ metaStatus: 'PENDING' }).limit(limit).toArray()
  },

  // === write ===

  async save(settlement: Settlement) {
    const { orderHash, execution } = settlement

    await Promise.all([
      dbOrderStates().updateOne(
        { chainId: settlement.execution.chainId, orderHash: settlement.orderHash },
        {
          $set: {
            status: 'filled',
            updatedAt: Date.now(),
          },
        },
        { upsert: true }
      ),
      dbSettlements().insertOne({
        ...settlement,
        ingestedAt: Date.now(),
      }),
    ])
  },

  async updateWithMeta(txHash: Hex, meta: SettlementMeta) {
    dbSettlements().updateOne(
      { 'execution.txHash': txHash },
      {
        $set: {
          orderAttributes: meta['order'],
          'execution.txContext': meta['txContext'],
          metaStatus: 'DONE',
        },
      }
    )
  },

  async markMetaDone(txHash: Hex, meta: SettlementMeta) {
    await dbSettlements().updateOne(
      { 'execution.txHash': txHash },
      {
        $set: {
          orderAttributes: meta.order,
          'execution.txContext': meta.txContext,
          metaStatus: 'DONE',
        },
      }
    )
  },

  async markMetaFailed(txHash: Hex, error: string) {
    await dbSettlements().updateOne(
      { 'execution.txHash': txHash },
      {
        $set: {
          metaStatus: 'FAILED',
          metaError: error,
        },
      }
    )
  },
}
