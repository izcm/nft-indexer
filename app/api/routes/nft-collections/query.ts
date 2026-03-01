import {
  topNFTCollectionsByActiveOrders,
  topNFTCollectionsBySettlements,
} from '#app/views/nft-collections/top-nft-collections.js'
import type { FastifyInstance } from 'fastify'

const handlers = {
  'active-orders': topNFTCollectionsByActiveOrders,
  settlements: topNFTCollectionsBySettlements,
} as const

export const nftCollectionsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { chainId: number; address: string } }>(
    '/:chainId/:address',
    async (_req, _res) => {
      // return repo.find
    }
  )

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
