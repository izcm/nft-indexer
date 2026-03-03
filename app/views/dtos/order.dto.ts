import { OrderCore, OrderRecord } from '#app/domain/order/model.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'

// todo: start and end must handle bigints
// api protects against huge start / end
// listener may store orders with full on 256 fields, these need to be handled

export type OrderDTO = {
  chainId: number

  type: 'ask' | 'bid'
  isCollectionBid: boolean

  collection: string
  tokenId: string

  price: string
  currency: string

  actor: string

  start: number
  end: number

  rawOrder: OrderCore
}

export const orderDTO = {
  from(r: OrderRecord): OrderDTO {
    const { order } = r

    return {
      chainId: r.chainId,

      type: order.side === 0 ? 'ask' : 'bid',
      isCollectionBid: order.isCollectionBid,

      collection: order.collection,
      tokenId: order.tokenId,

      price: order.price,
      currency: order.currency,

      actor: order.actor,

      start: secondsToUnixMs(Number(order.start)),
      end: secondsToUnixMs(Number(order.end)),

      rawOrder: { ...order, signature: undefined } as OrderCore,
    }
  },
}

export const toOrderDTO = orderDTO.from
