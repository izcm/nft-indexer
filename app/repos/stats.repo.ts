import { nftCollectionsStats as stats } from '#app/db/mongo.js'
import { OrderType, toOrderType } from '#app/domain/types/order.js'

import { isUnixSeconds } from '#app/lib/utils/time.js'
import { Hex } from 'viem'

type CollectionStatsKey = {
  chainId: number
  collection: Hex
  timestamp: number
}

type RecordSettlementArgs = CollectionStatsKey & {
  price: string
}

type RecordOrderArgs = CollectionStatsKey & {
  side: number
  isCollectionBid: boolean
}

const ORDER_TYPE_FIELD: Record<OrderType, string> = {
  ASK: 'activeAskCount',
  BID: 'activeBidCount',
  COLLECTION_BID: 'activeCbCount',
}

const EMPTY_COUNTERS = {
  activeAskCount: 0,
  activeBidCount: 0,
  activeCbCount: 0,
}

const makeInc = (type: OrderType, delta: 1 | -1) => ({
  [ORDER_TYPE_FIELD[type]]: delta,
})

const minWei = (a: string, b: string) => (BigInt(a) < BigInt(b) ? a : b)

// timestamp in seconds!
const startOfDay = (tsSeconds: number) => tsSeconds - (tsSeconds % 86400)

export const nftCollectionStatsRepo = {
  // === settlements (immutable on-chain history) ===

  async recordSettlement({ chainId, collection, timestamp, price }: RecordSettlementArgs) {
    // prices are in WEI
    // => has to be stored as string
    // => manual cast + calculation + back to string

    const day = startOfDay(timestamp) // block.timestamp guarantees unix seconds
    const doc = await stats().findOne({
      chainId,
      collection,
      day,
    })

    const prevVolume = doc?.volume ?? '0'
    const nextVolume = (BigInt(prevVolume) + BigInt(price)).toString()

    const prevFloorprice = doc?.floorPrice ?? '0'
    const nextFloorprice = minWei(price, prevFloorprice)

    return stats().updateOne(
      { chainId, collection, day },
      {
        $set: { volume: nextVolume, floorPrice: nextFloorprice },
        $setOnInsert: {
          chainId,
          collection,
          day,
          ...EMPTY_COUNTERS,
        },
      },
      { upsert: true }
    )
  },

  // async recordOrderCreated({
  //   chainId,
  //   collection,
  //   side,
  //   isCollectionBid,
  //   timestamp: orderStart,
  // }: RecordOrderArgs) {
  //   // json schema enforces unix seconds in api order-ingest
  //   const ts = Number(orderStart)

  //   if (!isUnixSeconds(ts)) {
  //     console.error('[stats] non-unix-seconds start', { start: orderStart })
  //     return
  //   }

  //   const day = startOfDay(ts)

  //   const orderType = toOrderType(side, isCollectionBid)
  //   const inc = makeInc(orderType, 1)

  //   return stats().updateOne(
  //     { chainId, collection, day },
  //     {
  //       $inc: inc,
  //       $setOnInsert: {
  //         chainId,
  //         collection,
  //         day,
  //         volume: '0',
  //         floorPrice: '0',
  //       },
  //     },
  //     { upsert: true }
  //   )
  // },

  // async recordOrderFilled({
  //   chainId,
  //   collection,
  //   side,
  //   isCollectionBid,
  //   timestamp: filledAt,
  // }: RecordOrderArgs) {
  //   const day = startOfDay(Number(filledAt))

  //   const orderType = toOrderType(side, isCollectionBid)
  //   const inc = makeInc(orderType, -1)

  //   return stats().updateOne(
  //     { chainId, collection, day },
  //     {
  //       $inc: inc,
  //       $setOnInsert: {
  //         chainId,
  //         collection,
  //         day,
  //         volume: '0',
  //         floorPrice: '0',
  //       },
  //     },
  //     { upsert: true }
  //   )
  // },
}
