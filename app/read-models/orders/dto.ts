import { OrderCore } from '#app/domain/order/types.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'

// todo: start and end must handle bigints
// api protects against huge start / end
// listener may store orders with full on 256 fields, these need to be handled

export const orderDTO = (order: OrderCore) => ({
  type: order.side === 0 ? 'ask' : 'bid',
  isCollectionBid: order.isCollectionBid,
  collection: order.collection,
  tokenId: order.tokenId,
  price: order.price,
  currency: order.currency,
  actor: order.actor,
  start: secondsToUnixMs(Number(order.start)),
  end: secondsToUnixMs(Number(order.end)),
})
