import { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import { ADDR_REGEX, SETTLEMENT_REGEX_ID } from '#app/domain/constants/regex.js'

import type { HttpPageRequest } from '#app/domain/shared/types/requests.js'
import type { SettlementKey } from '#app/domain/settlement/model.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

import { settlementRepo as repo } from '#app/repos/settlement.repo.js'

import { byIdParams, paginationQueryParams } from '../../shared/schemas.js'

import { readByKey } from '#app/di/read.js'

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

  fastify.get<{ Querystring: HttpPageRequest<any> & Record<string, unknown> }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            collection: { type: 'string', pattern: ADDR_REGEX },
            tokenId: { type: 'string', pattern: '^[0-9]+$' },
            seller: { type: 'string', pattern: ADDR_REGEX },
            buyer: { type: 'string', pattern: ADDR_REGEX },
            from: { type: 'integer', minimum: 0 }, // timestamp
            to: { type: 'integer', minimum: 0 }, // timestamp
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            cursor: { type: 'string', pattern: '^[0-9]+_[a-fA-F0-9]{24}$' },
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
        sortField: 'execution.block.timestamp',
        sortDir: 'asc',
        limit: limit ?? DEFAULT_PAGE_LIMIT,
      })
    }
  )
}
