import { isUintString } from '#app/lib/utils/string.js'
import { isUnixSeconds } from '#app/lib/utils/time.js'
import { OrderSide } from './model.js'
import type { Order, OrderType, SideLabel } from './model.js'

export const toOrderType = (side: number, isCollectionBid: boolean): OrderType => {
  const direction = OrderSide[side] as SideLabel
  return direction === 'BID' && isCollectionBid ? 'COLLECTION_BID' : direction
}

const MAX_DIGITS = 34 // Decimal128 safe limit

export const isValidOrder = (o: Order): boolean => {
  return (
    BigInt(o.price) > 0 &&
    BigInt(o.end) > BigInt(o.start) &&
    (o.side === OrderSide.ASK || o.side === OrderSide.BID) &&
    // validTimespan(Number(o.end), anchorTs) &&
    isUintString(o.price) &&
    isUnixSeconds(Number(o.start)) &&
    isUnixSeconds(Number(o.end)) &&
    o.price.length <= MAX_DIGITS &&
    o.actor !== '0x0000000000000000000000000000000000000000'
  )
}

// todo: signature validation
