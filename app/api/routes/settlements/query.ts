import { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import { SETTLEMENT_REGEX_ID } from '#app/domain/constants/regex.js'

import {
  Settlement,
  SETTLEMENT_SORT_FIELDS,
  SettlementSortField,
  type SettlementKey,
} from '#app/domain/settlement/model.js'
import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { SETTLEMENT_INCLUDES } from '#app/domain/shared/relations.js'
import { DomainPageQuery } from '#app/domain/shared/types/page.js'

import { settlementQueryableFields } from './schemas.js'
import { byIdParams, paginationQueryParams } from '../../shared/schemas.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const settlementsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams(SETTLEMENT_REGEX_ID) } },
    async (req, res) => {
      const { chainId, value: orderHash } = parseDomainId(req.params.id)
      const doc = readByKey('settlement', { chainId, orderHash } as SettlementKey)

      if (!doc) {
        res.code(404)
        return
      }

      return doc
    }
  )

  fastify.get<{ Querystring: HttpPageRequest<Settlement, 'settlement'> & Record<string, unknown> }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            ...settlementQueryableFields,
            ...paginationQueryParams,
            sortField: {
              type: 'string',
              enum: [...SETTLEMENT_SORT_FIELDS],
            },
            include: {
              type: 'array',
              maxItems: SETTLEMENT_INCLUDES.length,
              items: { type: 'string', enum: SETTLEMENT_INCLUDES },
            },
          },
        },
      },
    },
    async req => {
      const q = req.query

      const filters: Record<string, unknown> = {}

      const domainPageQuery: DomainPageQuery<Settlement> = {
        limit: q.limit ?? DEFAULT_PAGE_LIMIT,
        cursor: q.cursor,
        from: q.from,
        to: q.to,
        rangeField: 'createdAt', // todo: dont hardcode
        sortField: (q.sortField as SettlementSortField) ?? 'createdAt',
        sortDir: q.sortDir,
        filters,
      }

      return readPage('settlement', { ...domainPageQuery, include: q.include })
    }
  )
}
