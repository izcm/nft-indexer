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

  async findPendingMeta(chainId: number, limit: number) {
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
    const { chainId, orderHash, execution } = settlement

    return Promise.all([
      orderStates().updateOne(
        { chainId, orderHash },
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

  async finalizeMeta(chainId: number, orderHash: Hex, meta: SettlementMeta) {
    return settlements().updateOne(
      { chainId, orderHash },
      {
        $set: {
          orderAttributes: meta['order'],
          'execution.txContext': meta['txContext'],
          metaStatus: 'DONE',
        },
      }
    )
  },

  async markMetaFailed(chainId: number, orderHash: Hex, error: string) {
    return settlements().updateOne(
      { chainId, 'execution.txHash': orderHash },
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
 * - Prettifies multichain code
 */

export const settlementRepoFor = (chainId: number) => ({
  findPendingMeta(limit: number) {
    return settlementRepo.findPendingMeta(chainId, limit)
  },

  finalizeMeta(orderHash: Hex, meta: SettlementMeta) {
    return settlementRepo.finalizeMeta(chainId, orderHash, meta)
  },

  async markMetaFailed(orderHash: Hex, error: string) {
    return settlementRepo.markMetaFailed(chainId, orderHash, error)
  },
})
