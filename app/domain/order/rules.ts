import { isUintString } from '#app/lib/utils/string.js'
import { isUnixSeconds } from '#app/lib/utils/time.js'
import { Side } from './model.js'
import type { Order, OrderType, SideLabel } from './model.js'

export const toOrderType = (side: number, isCollectionBid: boolean): OrderType => {
  const direction = Side[side] as SideLabel
  return direction === 'BID' && isCollectionBid ? 'COLLECTION_BID' : direction
}

export const validOrder = (o: Order): boolean => {
  return (
    BigInt(o.price) > 0 &&
    BigInt(o.end) > BigInt(o.start) &&
    (o.side === Side.ASK || o.side === Side.BID) &&
    // validTimespan(Number(o.end), anchorTs) &&
    isUintString(o.price) &&
    isUnixSeconds(Number(o.start)) &&
    isUnixSeconds(Number(o.end)) &&
    o.actor !== '0x0000000000000000000000000000000000000000'
  )
}

// have signature validation here also
