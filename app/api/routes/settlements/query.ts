import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'

import { byIdParams } from '#app/api/shared/schemas.js'
import { settlementRepo as repo } from '#app/repos/settlement.repo.js'

export const settlementsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { params: byIdParams } },
    async (req, res) => {
      const doc = repo.findById(new ObjectId(req.params.id))

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

  fastify.get<{ Querystring: Record<string, any> }>(
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
