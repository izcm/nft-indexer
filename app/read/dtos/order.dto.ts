import { Order, OrderRecord } from '#app/domain/order/model.js'
import { Address, Hash } from '#app/domain/shared/types/eth.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'

// todo: start and end must handle bigints
// api protects against huge start / end
// listener may store orders with full on 256 fields, these need to be handled

export type OrderDTO = {
  id: string

  chainId: number
  orderHash: Hash

  side: 'ask' | 'bid'
  isCollectionBid: boolean

  collection: Address
  tokenId: string

  price: string
  currency: Address

  actor: Address

  start: number
  end: number

  rawOrder: Order

  status: string

  txHash?: Hash
}

export const orderDTO = {
  from(r: OrderRecord): OrderDTO {
    const { order } = r

    return {
      id: `${r.chainId}:${r.orderHash}`,

      chainId: r.chainId,
      orderHash: r.orderHash,

      side: order.side === 0 ? 'ask' : 'bid',
      isCollectionBid: order.isCollectionBid,

      collection: order.collection,
      tokenId: order.tokenId,

      price: order.price,
      currency: order.currency,

      actor: order.actor,

      start: secondsToUnixMs(Number(order.start)),
      end: secondsToUnixMs(Number(order.end)),

      rawOrder: order,

      status: r.status,
      txHash: r.chainEvent?.txHash,
    }
  },
}

// export const orderDTO = {
//   withRelations(
//     r: OrderRecord,
//     relations: { collectionName?: string }
//   ): OrderDTO & { collectionName?: string } {
//     return {
//       ...orderDTO.from(r),
//       collectionName: relations.collectionName,
//     }
//   },
// }

export const toOrderDTO = orderDTO.from
