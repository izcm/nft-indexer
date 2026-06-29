import type { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/config/api.js'

// --- domain ---
import type { NFTCollectionKey } from '#app/domain/nft-collection/model.js'
import type { PageRequest } from '#app/domain/shared/types/page.js'
import { parseDomainId } from '#app/domain/shared/ids.js'

// --- api ---
import { getOr404 } from '../../shared/get-or-404.js'
import { chainIdSchema, basicSortFields, paginationQueryParams } from '../../shared/schemas.js'

// --- di ---
import { readByKey, readPage } from '#app/di/read.js'

// NFTCollection query is very thin since
// current use-case is simply to fetch per chainId
export const nftCollectionsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (req, res) => {
    const { chainId, value: address } = parseDomainId(req.params.id)
    return getOr404(() => readByKey('nftCollection', { chainId, address } as NFTCollectionKey), res)
  })

  fastify.get<{
    Querystring: PageRequest<'nftCollection'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            chainId: chainIdSchema,
            ...paginationQueryParams,
            sortField: basicSortFields,
          },
        },
      },
    },
    async req => {
      const { query } = req

      const pageQuery = {
        limit: query.limit ?? DEFAULT_PAGE_LIMIT,
        sortField: 'createdAt',
        sortDir: query.sortDir,
      }

      return readPage('nftCollection', { ...pageQuery, include: [] })
    }
  )
}
