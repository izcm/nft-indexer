import { Decimal128 } from 'mongodb'

import { nfts, orders } from '#app/db/collections.js'

import type { OrderPort } from '#app/domain/order/port.js'
import type { Hash } from '#app/domain/shared/types/eth.js'
import type { OrderKey } from '#app/domain/order/model.js'

import { hashOrderStruct } from '#app/lib/blockchain/eip712.js'

import { makeReadRepo } from './shared/_read.js'
import { makeTsWrite } from './shared/_write.js'

import type { OrderDoc } from './model/docs.js'
import { ORDER_FIELD_TRANSFORMS } from './model/field-config.js'

const baseRead = makeReadRepo<OrderDoc, OrderKey>(
  orders,
  k => ({
    chainId: k.chainId,
    orderHash: k.orderHash,
  }),
  ORDER_FIELD_TRANSFORMS
)

const write = makeTsWrite(orders)

export const orderRepo: OrderPort = {
  // === read ===
  ...baseRead,

  // === write ===
  async ensure(chainId, order) {
    const { signature, ...orderCore } = order
    const orderHash = hashOrderStruct(orderCore) // todo: move this out of repo

    const { collection, tokenId, price, start, end } = orderCore

    const nft = await nfts().findOne({
      chainId,
      collection,
      tokenId,
    })

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

          // nft attributes for pagination filters
          attributes: nft?.attributes ?? null,
          db: {
            price: Decimal128.fromString(price),

            // cast for sorting only, domain stays uint64 string
            start: Number(start),
            end: Number(end),
          },
        },
      },
      { upsert: true }
    )

    const didUpsert = !!res.upsertedCount

    return { chainId, orderHash, didUpsert }
  },

  async cancelOrdersByChainIdNonce({ chainId, user, nonce, cancellation }) {
    const filter = { chainId, 'order.actor': user, 'order.nonce': nonce }

    const docs = await orders().find(filter).project({ orderHash: 1 }).toArray()

    await write.updateMany(filter, {
      $set: {
        status: 'cancelled',
        chainEvent: cancellation,
      },
    })

    return docs.map(d => ({
      orderHash: d.orderHash,
    }))
  },

  async markOrderFilled({ chainId, orderHash, chainEvent }) {
    await write.updateOne(
      { chainId, orderHash },
      { $set: { status: 'filled', chainEvent: chainEvent } }
    )
  },

  async updateStatus({ chainId, orderHash, status }) {
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
 * OPTIONAL WRAPPER
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
