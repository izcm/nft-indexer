import type { FastifyInstance } from 'fastify'

import { ORDER_ID_REGEX } from '#app/domain/constants/regex.js'
import type { OrderKey, OrderRecord } from '#app/domain/order/model.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { byIdParams } from '#app/api/shared/schemas.js'
import { getOr404 } from '#app/api/shared/get-or-404.js'
import { basePageQuery, buildAttributeFilters, buildFilters } from '#app/api/shared/page-query.js'

import {
  orderCoreQueryableFields,
  orderPageSchema,
  orderRecordNestedMap,
  orderRecordQueryableFields,
} from './schemas.js'

// -- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const ordersQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams(ORDER_ID_REGEX) } },
    async (req, res) => {
      const { chainId, value: orderHash } = parseDomainId(req.params.id)
      return getOr404(() => readByKey('order', { chainId, orderHash } as OrderKey), res)
    }
  )

  fastify.get<{
    Querystring: HttpPageRequest<'order'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: orderPageSchema,
    },
    async req => {
      const query = req.query

      const filters = {
        ...buildFilters(query, orderRecordQueryableFields, orderRecordNestedMap),
        ...buildAttributeFilters(query),
      }

      console.log(filters)
      const domainPageQuery: DomainPageQuery = {
        ...basePageQuery(query),
        filters,
      }

      return readPage('order', { ...domainPageQuery, include: query.include })
    }
  )
}
