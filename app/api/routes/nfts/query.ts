import { FastifyInstance } from 'fastify'

import type { NFTKey } from '#app/domain/nft/model.js'

import type { PageRequest } from '#app/domain/shared/types/page.js'
import type { PageQuery } from '#app/domain/shared/types/page.js'
import { parseTripleDomainId } from '#app/domain/shared/ids.js'

import { getOr404 } from '../../shared/get-or-404.js'
import {
  buildPageQuery,
  buildAttributeFilters,
  buildFilters,
} from '../../shared/build-page-query.js'
import { nftPageSchema, nftQueryableFields } from './schemas.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const nftsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (req, res) => {
    // three-part id chainId:collection:tokenId
    const key = parseTripleDomainId(req.params.id)
    return getOr404(() => readByKey('nft', key as NFTKey), res)
  })

  fastify.get<{
    Querystring: PageRequest<'nft'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: nftPageSchema,
    },
    async (req, res) => {
      const { query } = req

      const filters = {
        ...buildFilters(query, nftQueryableFields),
        ...buildAttributeFilters(query),
      }

      const pageQuery: PageQuery = {
        ...buildPageQuery(query),
        filters,
      }

      return readPage('nft', { ...pageQuery, include: [] })
    }
  )
}
