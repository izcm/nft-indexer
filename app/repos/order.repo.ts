import { orders } from '#app/db/collections.js'
import type { Order, OrderStatus } from '#app/domain/order/types.js'
import type { Hash } from '#app/domain/shared/types.js'
import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'
import type { FindPageArgs } from '#app/repos/_shared/types.js'
import { ObjectId } from 'mongodb'
import { findPageGeneric } from './_shared/paginate.js'

export type OrderKey = {
  chainId: number
  orderHash: Hash
}

export const orderRepo = {
  // === read ===

  async findById(id: ObjectId) {
    return orders().findOne({ _id: id })
  },

  async findByKey(key: OrderKey) {
    const { chainId, orderHash } = key
    return orders().findOne({ chainId, orderHash })
  },

  async findPage({ filters = {}, from, to, cursor, sortField, sortDir, limit }: FindPageArgs) {
    const query = { ...filters }

    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = from
      if (to) query.createdAt.$lte = to
    }

    return findPageGeneric({
      dbCollection: orders(),
      baseQuery: query,
      sortField,
      sortDir,
      cursor,
      limit,
    })
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
    const didUpsert = res.lastErrorObject?.updatedExisting === false

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
  findByHash(orderHash: Hash) {
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
