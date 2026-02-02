import { Hex } from 'viem'
import { ObjectId } from 'mongodb'

import { settlements, orderStates } from '#app/db/mongo.js'

import { Settlement, SettlementMeta } from '#app/domain/types/settlement.js'
import { FindPageArgs } from '#app/repos/types.js'

export const settlementRepo = {
  // === read ===
  async findById(id: ObjectId) {
    return settlements().findOne({ _id: id })
  },

  async findPendingMeta(limit: number) {
    return settlements().find({ metaStatus: 'PENDING' }).limit(limit).toArray()
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

    const docs = await settlements()
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

  // === write ===

  async save(settlement: Settlement) {
    const { orderHash, execution } = settlement

    await Promise.all([
      orderStates().updateOne(
        { chainId: settlement.chainId, orderHash: settlement.orderHash },
        {
          $set: {
            status: 'filled',
            updatedAt: Date.now(),
          },
        },
        { upsert: true }
      ),
      settlements().insertOne({
        ...settlement,
        ingestedAt: Date.now(),
      }),
    ])
  },

  async finalizeWithMeta(chainId: number, txHash: Hex, meta: SettlementMeta) {
    settlements().updateOne(
      { chainId, 'execution.txHash': txHash },
      {
        $set: {
          orderAttributes: meta['order'],
          'execution.txContext': meta['txContext'],
          metaStatus: 'DONE',
        },
      }
    )
  },

  async markMetaDone(chainId: number, txHash: Hex, meta: SettlementMeta) {
    await settlements().updateOne(
      { chainId, 'execution.txHash': txHash },
      {
        $set: {
          orderAttributes: meta.order,
          'execution.txContext': meta.txContext,
          metaStatus: 'DONE',
        },
      }
    )
  },

  async markMetaFailed(chainId: number, txHash: Hex, error: string) {
    await settlements().updateOne(
      { chainId, 'execution.txHash': txHash },
      {
        $set: {
          metaStatus: 'FAILED',
          metaError: error,
        },
      }
    )
  },
}

/**
 * WRAPPER
 * - Used only by workers
 * - Prettifies multichain code
 */
