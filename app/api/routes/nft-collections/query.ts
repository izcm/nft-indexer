import type { FastifyInstance } from 'fastify'

import type { NFTCollection, NFTCollectionKey } from '#app/domain/nft-collection/model.js'

import { DEFAULT_PAGE_LIMIT } from '#app/config/api.js'
import type { PageQuery } from '#app/domain/shared/types/page.js'
import type { PageRequest } from '#app/domain/shared/types/page.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'
import { getOr404 } from '#app/api/shared/get-or-404.js'

export const nftCollectionsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (req, res) => {
    const { chainId, value: address } = parseDomainId(req.params.id)
    return getOr404(() => readByKey('nftCollection', { chainId, address } as NFTCollectionKey), res)
  })

  fastify.get<{
    Querystring: PageRequest<'nftCollection'> & Record<string, unknown>
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

      const domainPageQuery = {
        limit: q.limit ?? DEFAULT_PAGE_LIMIT,
        sortField: 'createdAt',
        sortDir: q.sortDir,
      }

      return readPage('nftCollection', { ...domainPageQuery, include: [] })
    }
  )

  // const handlers = {
  //   'active-orders': topNFTCollectionsByActiveOrders,
  //   settlements: topNFTCollectionsBySettlements,
  // } as const

  // // not in use (project started out as multi-collection)
  // fastify.get<{ Querystring: { chainId: number; by?: keyof typeof handlers; limit: number } }>(
  //   '/top',
  //   {
  //     schema: {
  //       querystring: {
  //         type: 'object',
  //         required: ['chainId'],
  //         properties: {
  //           chainId: {
  //             type: 'integer',
  //           },
  //           by: {
  //             enum: Object.keys(handlers),
  //           },
  //           limit: { type: 'integer', minimum: 1, maximum: 50 },
  //         },
  //       },
  //     },
  //   },
  //   async req => {
  //     const by = req.query.by ?? 'active-orders'
  //     const fn = handlers[by]

  //     return fn(req.query.chainId, req.query.limit)
  //   }
  // )
}
