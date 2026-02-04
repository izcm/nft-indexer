import { nftCollectionsStats } from '#app/db/mongo.js'
import { Hex } from 'viem'

export type nftCollectionStats = {
  chainId: number
  collectionAddres: Hex
  day: number // unix timestamp at 00:00 UTC
  volume: string // wei
  floorPrice: string
  activeAskCount: number
  activeBidCount: number
}

type CollectionStatsKey = {
  chainId: number
  collectionAddress: Hex
}

type RecordSettlementArgs = CollectionStatsKey & {
  timestamp: number
  price: string
}

type RecordOrderArgs = CollectionStatsKey & {
  side: 'BID' | 'ASK'
  start: number // timestamp `order.start`
}

const minWei = (a: string, b: string) => (BigInt(a) < BigInt(b) ? a : b)

// timestamp in seconds!
const day = (tsSeconds: number) => tsSeconds - (tsSeconds % 86400)

export const nftCollectionStatsRepo = {
  // === settlements (immutable on-chain history) ===

  async recordSettlement({ chainId, collectionAddress, timestamp, price }: RecordSettlementArgs) {
    const day = timestamp //todo asap: make todayMidnight()

    // prices are in WEI
    // => has to be stored as string
    // => manual cast + calculation + back to string

    const doc = await nftCollectionsStats().findOne({
      chainId,
      collectionAddress,
      day,
    })

    const prevVolume = doc?.volume ?? '0'
    const nextVolume = (BigInt(prevVolume) + BigInt(price)).toString()

    const prevFloorprice = doc?.floorPrice ?? '0'
    const nextFloorprice = minWei(price, prevFloorprice)

    await nftCollectionsStats().updateOne(
      { chainId, collectionAddress, day },
      {
        $set: { volume: nextVolume, floorprice: nextFloorprice },
        $setOnInsert: {
          chainId,
          collectionAddress,
          activeAskCount: 0,
          activeBidCount: 0,
        },
      },
      { upsert: true }
    )
  },

  async recordOrderCreated({ chainId, collectionAddress, side, start }: RecordOrderArgs) {
    const inc = side === 'ASK' ? { activeAskCount: 1 } : { activeBidCount: 1 }

    await nftCollectionsStats().updateOne(
      { chainId, collectionAddress },
      {
        $inc: inc,
        $setOnInsert: {
          chainId,
          collectionAddress,
          volume: '0',
          floorPrice: '0',
          activeAskCount: 0,
          activeBidCount: 0,
        },
      },
      { upsert: true }
    )
  },

  async recordOrderFilled({ chainId, collectionAddress, side }: RecordOrderArgs) {
    const inc = side === 'ASK' ? { activeAskCount: 1 } : { activeBidCount: 1 }

    await nftCollectionsStats().updateOne(
      { chainId, collectionAddress },
      {
        $inc: inc,
        $setOnInsert: {
          chainId,
          collectionAddress,
          volume: '0',
          floorPrice: '0',
          activeAskCount: 0,
          activeBidCount: 0,
        },
      },
      { upsert: true }
    )
  },
}
