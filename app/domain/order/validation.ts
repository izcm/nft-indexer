import type { Hex } from 'viem'
import { encodeAbiParameters, keccak256, toBytes, zeroAddress } from 'viem'
import { Order, Side } from './types.js'
import { isUintString } from '#app/lib/utils/string.js'
import { isUnixSeconds } from '#app/lib/utils/time.js'

const MAX_ORDER_LIFETIME = 180 * 24 * 60 * 60 // 90 days

// const validTimespan = (end: number, now: number): boolean => end <= BigInt(now + MAX_ORDER_LIFETIME)

export const validOrder = (o: Order, anchorTs: number): boolean => {
  return (
    BigInt(o.price) > 0 &&
    BigInt(o.end) > BigInt(o.start) &&
    (o.side === Side.ASK || o.side === Side.BID) &&
    // validTimespan(Number(o.end), anchorTs) &&
    isUintString(o.price) &&
    isUnixSeconds(Number(o.start)) &&
    isUnixSeconds(Number(o.end)) &&
    // commented out since the demo includes fork time-warping
    // BigInt(o.end) >= Math.floor(Date.now() / 1000) &&
    o.actor !== zeroAddress
  )
}

// have signature validation here also
