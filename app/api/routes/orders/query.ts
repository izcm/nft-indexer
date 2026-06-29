import type { FastifyInstance } from 'fastify'

import { ORDER_ID_REGEX } from '#app/domain/constants/regex.js'
import type { OrderKey } from '#app/domain/order/model.js'
import type { PageQuery } from '#app/domain/shared/types/page.js'
import type { PageRequest } from '#app/domain/shared/types/page.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { byIdParams } from '../../shared/schemas.js'
import { getOr404 } from '../../shared/get-or-404.js'
import {
  buildPageQuery,
  buildAttributeFilters,
  buildFilters,
} from '../../shared/build-page-query.js'

import {
  ORDER_SORT_FIELDS_MAP,
  orderPageSchema,
  orderRecordNestedMap,
  orderRecordQueryableFields,
  orTransform,
} from './schemas.js'

// -- di ---
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
    Querystring: PageRequest<'order'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: orderPageSchema,
    },
    async req => {
      const query = req.query

      const filters = {
        ...buildFilters(query, orderRecordQueryableFields, orderRecordNestedMap, orTransform),
        ...buildAttributeFilters(query),
      }

      const pageQuery: PageQuery = {
        ...buildPageQuery(query, ORDER_SORT_FIELDS_MAP),
        filters,
      }

      return readPage('order', { ...pageQuery, include: query.include })
    }
  )
}
