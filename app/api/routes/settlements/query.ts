import { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import { SETTLEMENT_REGEX_ID } from '#app/domain/constants/regex.js'

import type { Settlement, SettlementKey } from '#app/domain/settlement/model.js'
import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { byIdParams, chainEventQueryableFields } from '#app/api/shared/schemas.js'
import {
  basePageQuery,
  buildAttributeFilters,
  buildFilters,
} from '#app/api/shared/build-page-query.js'
import { getOr404 } from '#app/api/shared/get-or-404.js'

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

  fastify.get<{ Querystring: HttpPageRequest<'settlement'> & Record<string, unknown> }>(
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

      const domainPageQuery: DomainPageQuery = {
        ...basePageQuery(query, SETTLEMENT_SORT_FIELDS_MAP),
        filters,
      }

      return readPage('settlement', { ...domainPageQuery, include: query.include })
    }
  )
}
