import { orders, settlements } from '#app/db/collections.js'

import { NFTCollection } from '#app/domain/nft-collection/model.js'
import { Side } from '#app/domain/order/model.js'

export type TopNFTCollectionByActiveOrders = NFTCollection & {
  summary: ActiveCounts
}

// todo:
// add floorprice &
// order actor
export type ActiveCounts = {
  activeAskCount: number
  activeBidCount: number
  activeCbCount: number
  totalActive: number
}

type OrderFields = {
  side: string
  isCb: string
}

export const topNFTCollectionsBySettlements = async (limit: number) => {
  const id = { chainId: '$chainId', collection: '$collection' }
  const orderFields: OrderFields = {
    side: '$orderAttributes.side',
    isCb: '$orderAttributes.isCollectionBid',
  }

  const pipeline = buildPipeline({ match: {}, id, limit, orderFields })

  const rows = await settlements().aggregate(pipeline).toArray()
}

const buildPipeline = ({
  match,
  id,
  limit,
  orderFields,
}: {
  match: {}
  id: {}
  limit: number
  orderFields: OrderFields
}) => {
  return [
    { $match: match },
    {
      $group: {
        _id: id,

        activeAskCount: {
          $sum: {
            $cond: [{ $eq: [orderFields.side, Side.ASK] }, 1, 0],
          },
        },

        activeBidCount: {
          $sum: {
            $cond: [
              {
                $and: [{ $eq: [orderFields.side, Side.BID] }, { $eq: [orderFields.isCb, false] }],
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
                $and: [{ $eq: [orderFields.side, Side.BID] }, { $eq: [orderFields.isCb, true] }],
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

    // limit placed after lookup/unwind to ensure missing collection docs
    // do not consume top-N slots

    { $sort: { totalActive: -1 } },
    { $limit: limit },

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
}

export const topNFTCollectionsByActiveOrders = async (chainId: number, limit: number = 10) => {
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

    // limit placed after lookup/unwind to ensure missing collection docs
    // do not consume top-N slots

    { $sort: { totalActive: -1 } },
    { $limit: limit },

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

  const rows = await orders().aggregate<TopNFTCollectionByActiveOrders>(pipeline).toArray()

  return rows
}
