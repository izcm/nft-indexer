import type { FastifyInstance } from 'fastify'

import { ORDER_ID_REGEX } from '#app/domain/constants/regex.js'
import { ORDER_SORT_FIELDS } from '#app/domain/order/model.js'
import { RESOURCE_NAMES } from '#app/domain/shared/types/resources.js'
import type {
  OrderKey,
  OrderQueryModel,
  OrderRecord,
  OrderSortField,
} from '#app/domain/order/model.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { HttpPageRequest } from '#app/domain/shared/types/requests.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

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
        rangeField: 'createdAt', // todo: dont hardcode this
        sortField: (q.sortField as OrderSortField) ?? 'createdAt',
        sortDir: q.sortDir,
        filters,
      }

      return readPage('order', { ...domainPageQuery, include: q.include })
    }
  )
}
