import { Hex } from 'viem'
import { nftCollections, orders } from '#app/db/mongo.js'

import { NFTCollection } from '../types/nft-collection.js'
import { Side } from '../types/order.js'

export type TopCollectionByActiveOrders = NFTCollection & {
  summary: TopCollectionActiveCounts
}

export type TopCollectionActiveCounts = {
  collection: Hex
  activeAskCount: number
  activeBidCount: number
  activeCbCount: number
  totalActive: number
}

export const topCollectionsBySettlements = () => {}

export const topCollectionsByActiveOrders = async (chainId: number, limit: number) => {
  const match: any = { chainId, status: 'active' }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$order.collection',

        activeAskCount: {
          $sum: {
            $cond: [
              {
                $and: [{ $eq: ['$order.side', Side.ASK] }],
              },
              1,
              0,
            ],
          },
        },

        activeBidCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $and: [
                      { $eq: ['$order.side', Side.BID] },
                      { $eq: ['$order.isCollectionBid', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            ],
          },
        },

        activeCbCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $and: [
                      { $eq: ['$order.side', Side.BID] },
                      { $eq: ['$order.isCollectionBid', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            ],
          },
        },
      },
    },

    {
      $addFields: {
        totalActive: { $add: ['$activeAskCount', '$activeBidCount', '$activeCbCount'] },
      },
    },

    { $sort: { totalActive: -1 } },
    { $limit: limit },

    {
      $lookup: {
        from: 'nftCollections',
        localField: '_id',
        foreignField: 'address',
        as: 'doc',
      },
    },

    { $unwind: '$doc' },
  ]

  const rows = await orders().aggregate<TopCollectionActiveCounts>(pipeline).toArray()

  const addresses = rows.map(r => r.collection)

  const collectionDocs = await nftCollections()
    .find({ chainId, address: { $in: addresses } })
    .toArray()

  const byAddr = new Map(collectionDocs.map(c => [c.address, c]))
}
