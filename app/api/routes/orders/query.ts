import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { orderQueryableFields } from './schema.js'
import { byIdParams, paginationQueryParams } from '../../shared/schemas.js'

import { orderRepo } from '#app/repos/order.repo.js'

import { readPage } from '#app/views/read-page.js'
import { RESOURCE_NAMES } from '#app/views/shared/types/resource-defs.js'
import { PageQuery } from '#app/views/shared/types/page-query.js'

export const ordersQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams } },
    async (req, res) => {
      const doc = await orderRepo.findById(new ObjectId(req.params.id))

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

  fastify.get<{
    Querystring: PageQuery
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ...orderQueryableFields,
            ...paginationQueryParams,
            include: {
              type: 'array',
              maxItems: RESOURCE_NAMES.length - 1,
              items: { type: 'string', enum: RESOURCE_NAMES },
            },
          },
        },
      },
    },
    async req => {
      return readPage('order', req.query)
    }
  )
}
