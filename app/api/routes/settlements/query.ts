import { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import { ADDR_REGEX, SETTLEMENT_REGEX_ID } from '#app/domain/constants/regex.js'

import { RESOURCE_NAMES } from '#app/domain/shared/types/resources.js'
import {
  Settlement,
  SETTLEMENT_SORT_FIELDS,
  type SettlementKey,
} from '#app/domain/settlement/model.js'
import type { HttpPageRequest } from '#app/domain/shared/types/requests.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { settlementRepo as repo } from '#app/repos/settlement.repo.js'

import { settlementQueryableFields } from './schemas.js'
import { byIdParams, paginationQueryParams } from '../../shared/schemas.js'

// --- DI ---
import { readByKey } from '#app/di/read.js'
import { SETTLEMENT_INCLUDES } from '#app/domain/shared/relations.js'

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
          },
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
    async req => {
      const { from, to, limit, cursor, ...filters } = req.query

      return repo.findPage({
        filters,
        from,
        to,
        cursor,
        sortField: 'ingestedAt', // todo: don't hardcode here either
        sortDir: 'asc',
        limit: limit ?? DEFAULT_PAGE_LIMIT,
      })
    }
  )
}
