import { FastifyInstance } from 'fastify'

import {
  topNFTCollectionsByActiveOrders,
  topNFTCollectionsBySettlements,
} from '#app/domain/queries/top-nft-collections.js'
import { queryObjects } from 'node:v8'

const handlers = {
  'active-orders': topNFTCollectionsByActiveOrders,
  settlements: topNFTCollectionsBySettlements,
} as const

export const collectionsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: { chainId: number; by?: keyof typeof handlers; limit: number } }>(
    '/top',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['chainId'],
          properties: {
            chainId: {
              type: 'integer',
            },
            by: {
              enum: Object.keys(handlers),
            },
            limit: { type: 'integer', minimum: 1, maximum: 50 },
          },
        },
      },
    },
    async req => {
      const by = req.query.by ?? 'active-orders'
      const fn = handlers[by]

      return fn(req.query.chainId, req.query.limit)
    }
  )
}
