import type { FastifyInstance } from 'fastify'

import {
  topNFTCollectionsByActiveOrders,
  topNFTCollectionsBySettlements,
} from '#app/views/top-nft-collections.js'

import type { NFTCollection, NFTCollectionKey } from '#app/domain/nft-collection/model.js'
import { OrderSortField } from '#app/domain/order/model.js'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'

const handlers = {
  'active-orders': topNFTCollectionsByActiveOrders,
  settlements: topNFTCollectionsBySettlements,
} as const

export const nftCollectionsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (req, res) => {
    const { chainId, value: address } = parseDomainId(req.params.id)
    const doc = await readByKey('nftCollection', { chainId, address } as NFTCollectionKey)

    if (!doc) {
      res.code(404)
      return
    }

    return doc
  })

  fastify.get<{
    Querystring: HttpPageRequest<NFTCollection, 'nftCollection'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
        },
      },
    },
    async req => {
      const q = req.query

      const domainPageQuery: DomainPageQuery<NFTCollection> = {
        limit: q.limit ?? DEFAULT_PAGE_LIMIT,
        sortField: (q.sortField as OrderSortField) ?? 'createdAt',
        sortDir: q.sortDir,
      }

      return readPage('nftCollection', { ...domainPageQuery, include: [] })
    }
  )

  // not in use (project started out as multi-collection)
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
