import { Hex } from 'viem'
import { nftCollectionsStats as stats } from '#app/db/collections.js'

type CollectionStatsKey = {
  chainId: number
  collection: Hex
  timestamp: number
}

type RecordSettlementArgs = CollectionStatsKey & {
  price: string
}

const minWei = (a: string, b: string) => (BigInt(a) < BigInt(b) ? a : b)

// input ts must be unix seconds
const startOfDay = (tsSeconds: number) => tsSeconds - (tsSeconds % 86400)

export const statsRepo = {
  // === settlements (immutable on-chain history) ===

  async recordSettlement({ chainId, collection, timestamp, price }: RecordSettlementArgs) {
    // prices are in WEI
    // => has to be stored as string
    // => manual cast => calculation => back to string

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
        },
      },
      { upsert: true }
    )
  },
}
