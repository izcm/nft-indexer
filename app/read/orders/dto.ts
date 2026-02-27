import { OrderCore, OrderRecord } from '#app/domain/order/types.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'

// todo: start and end must handle bigints
// api protects against huge start / end
// listener may store orders with full on 256 fields, these need to be handled

type OrderDTO = {
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

export const toOrderDTO = (record: OrderRecord): OrderDTO => {
  const { order } = record

  return {
    chainId: record.chainId,

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
}
