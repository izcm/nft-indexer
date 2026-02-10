import { Hex } from 'viem'
import { orders } from '#app/db/collections.js'

import { NFTCollection } from '../nft-collection/types.js'
import { Side } from '../order/types.js'

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

// todo... add timespans
export const topCollectionsByActiveOrders = async (chainId: number, limit: number) => {
  const match: any = { chainId, status: 'active' }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          chainId: '$chainId',
          collection: '$order.collection',
        },

        activeAskCount: {
          $sum: {
            $cond: [{ $eq: ['$order.side', Side.ASK] }, 1, 0],
          },
        },

        activeBidCount: {
          $sum: {
            $cond: [
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
        },

        activeCbCount: {
          $sum: {
            $cond: [
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
        from: 'nft-collections',

        let: {
          addr: '$_id.collection',
          cid: '$_id.chainId',
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$address', '$$addr'] }, { $eq: ['$chainId', '$$cid'] }],
              },
            },
          },
        ],
        as: 'doc',
      },
    },

    { $unwind: '$doc' },

    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$doc',
            {
              summary: {
                activeAskCount: '$activeAskCount',
                activeBidCount: '$activeBidCount',
                activeCbCount: '$activeCbCount',
                totalActive: '$totalActive',
              },
            },
          ],
        },
      },
    },
  ]

  const rows = await orders().aggregate<TopCollectionByActiveOrders>(pipeline).toArray()

  return rows
}
