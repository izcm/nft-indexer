import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import {
  ORDER_SORT_FIELDS,
  OrderQueryModel,
  OrderRecord,
  OrderSortField,
} from '#app/domain/order/model.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { HttpPageRequest } from '#app/domain/shared/types/requests.js'
import { RESOURCE_NAMES } from '#app/domain/shared/types/resources.js'

import { orderCoreQueryableFields, orderRecordQueryableFields } from './schemas.js'
import { byIdParams, paginationQueryParams } from '../../shared/schemas.js'
import { readById, readPage } from '#app/di/read.js'

export const ordersQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams } },
    async (req, res) => {
      // todo: api shouldnt depend on ObjectId
      const id = new ObjectId(req.params.id)
      const doc = await readById('order', id)

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
    Querystring: HttpPageRequest<OrderQueryModel> & Record<string, unknown>
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ...orderRecordQueryableFields,
            ...paginationQueryParams,
            sortField: {
              type: 'string',
              enum: [...ORDER_SORT_FIELDS],
            },
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
      const q = req.query

      const filters: Record<string, unknown> = {}

      const coreKeys = new Set(Object.keys(orderCoreQueryableFields))

      for (const key of Object.keys(orderRecordQueryableFields)) {
        const v = q[key]
        if (v === undefined) continue

        // if key is an orderCore key => prefix path with "order"
        const path = coreKeys.has(key) ? `order.${key}` : key

        filters[path] = v
      }

      const domainPageQuery: DomainPageQuery<OrderRecord> = {
        limit: q.limit,
        cursor: q.cursor,
        from: q.from,
        to: q.to,
        rangeField: 'createdAt',
        sortField: q.sortField as OrderSortField,
        sortDir: q.sortDir,
        filters,
      }

      return readPage('order', { ...domainPageQuery, include: q.include })
    }
  )
}
