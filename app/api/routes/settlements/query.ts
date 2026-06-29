import { FastifyInstance } from 'fastify'

import { SETTLEMENT_REGEX_ID } from '#app/domain/constants/regex.js'

import type { SettlementKey } from '#app/domain/settlement/model.js'
import type { PageRequest } from '#app/domain/shared/types/page.js'
import type { PageQuery } from '#app/domain/shared/types/page.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { byIdParams } from '../../shared/schemas.js'
import {
  buildPageQuery,
  buildAttributeFilters,
  buildFilters,
} from '../../shared/build-page-query.js'
import { getOr404 } from '../../shared/get-or-404.js'

import {
  SETTLEMENT_SORT_FIELDS_MAP,
  settlementNestedMap,
  settlementPageQuery,
  settlementQueryableFields,
} from './schemas.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const settlementsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams(SETTLEMENT_REGEX_ID) } },
    async (req, res) => {
      const { chainId, value: orderHash } = parseDomainId(req.params.id)
      return getOr404(() => readByKey('settlement', { chainId, orderHash } as SettlementKey), res)
    }
  )

  fastify.get<{ Querystring: PageRequest<'settlement'> & Record<string, unknown> }>(
    '/',
    {
      schema: settlementPageQuery,
    },
    async req => {
      const query = req.query

      const filters = {
        ...buildFilters(query, settlementQueryableFields, settlementNestedMap),
        ...buildAttributeFilters(query),
      }

      const pageQuery: PageQuery = {
        ...buildPageQuery(query, SETTLEMENT_SORT_FIELDS_MAP, {
          defaultSortField: SETTLEMENT_SORT_FIELDS_MAP.timestamp,
          defaultSortDir: 'desc',
        }),
        filters,
      }

      return readPage('settlement', { ...pageQuery, include: query.include })
    }
  )
}
