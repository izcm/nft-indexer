import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/api.js'

import { byIdParams, paginationQueryParams } from '#app/api/schemas/shared.js'
import { orderQueryableFields } from '#app/api/schemas/order.js'

import * as orderQuery from '#app/domain/queries/order.query.js'
import { orderRepo as repo } from '#app/repos/order.repo.js'

export const ordersQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams } },
    async (req, res) => {
      const doc = await repo.findById(new ObjectId(req.params.id))

      if (!doc) {
        res.code(404)
        return
      }

      return doc
    }
  )

  // ! NB !
  // from / to + cursor can conflict (timestamp collision) which then returns an empty set
  // callers are responsible for constructing sensible queries

  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ...orderQueryableFields,
            ...paginationQueryParams,
            include: { type: 'string' },
          },
        },
      },
    },
    async req => {
      const { from, to, limit, cursor, include, ...filters } = req.query as Record<string, any>

      const includeCollection = (include as string) && include.split(',').includes('collection')

      return orderQuery.findPage(
        {
          filters,
          from,
          to,
          cursor,
          sortField: 'createdAt',
          sortDir: -1,
          limit: limit ?? DEFAULT_PAGE_LIMIT,
        },
        {
          includeCollection,
        }
      )
    }
  )
}
