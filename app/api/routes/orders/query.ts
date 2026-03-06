import type { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import { ORDER_ID_REGEX } from '#app/domain/constants/regex.js'

import { ORDER_SORT_FIELDS } from '#app/domain/order/model.js'
import type {
  OrderKey,
  OrderQueryModel,
  OrderRecord,
  OrderSortField,
} from '#app/domain/order/model.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { HttpPageRequest } from '#app/domain/shared/types/requests.js'
import { parseDomainId } from '#app/domain/shared/ids.js'
import { ORDER_INCLUDES } from '#app/domain/shared/relations.js'

import { orderCoreQueryableFields, orderRecordQueryableFields } from './schemas.js'
import { byIdParams, paginationQueryParams } from '../../shared/schemas.js'

// -- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const ordersQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams(ORDER_ID_REGEX) } },
    async (req, res) => {
      const { chainId, value: orderHash } = parseDomainId(req.params.id)
      const doc = await readByKey('order', { chainId, orderHash } as OrderKey)

      if (!doc) {
        res.code(404)
        return
      }

      return doc
    }
  )

  fastify.get<{
    Querystring: HttpPageRequest<OrderQueryModel, 'order'> & Record<string, unknown>
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
              maxItems: ORDER_INCLUDES.length,
              items: { type: 'string', enum: ORDER_INCLUDES },
            },
          },
        },
      },
    },
    async req => {
      const q = req.query

      const filters: Record<string, unknown> = {}

      const orderCoreKeys = new Set(Object.keys(orderCoreQueryableFields))

      for (const key of Object.keys(orderRecordQueryableFields)) {
        const v = q[key]
        if (v === undefined) continue

        // key is OrderCore field => prefix path with "order"
        const path = orderCoreKeys.has(key) ? `order.${key}` : key

        filters[path] = v
      }

      const domainPageQuery: DomainPageQuery<OrderRecord> = {
        limit: q.limit ?? DEFAULT_PAGE_LIMIT,
        cursor: q.cursor,
        from: q.from,
        to: q.to,
        rangeField: 'createdAt', // todo: dont hardcode this
        sortField: (q.sortField as OrderSortField) ?? 'createdAt',
        sortDir: q.sortDir,
        filters,
      }

      return readPage('order', { ...domainPageQuery, include: q.include })
    }
  )
}
