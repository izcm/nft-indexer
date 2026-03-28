import { FastifyInstance } from 'fastify'

import type { NFT, NFTKey } from '#app/domain/nft/model.js'

import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'
import { parseTripleDomainId } from '#app/domain/shared/ids.js'

import { getOr404 } from '#app/api/shared/get-or-404.js'
import { basePageQuery, buildAttributeFilters, buildFilters } from '#app/api/shared/page-query.js'

import { nftPageSchema, nftQueryableFields } from './schema.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const nftsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (req, res) => {
    // three-part id chainId:collection:tokenId
    const key = parseTripleDomainId(req.params.id)
    return getOr404(() => readByKey('nft', key as NFTKey), res)
  })

  fastify.get<{
    Querystring: HttpPageRequest<NFT, 'nft'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: nftPageSchema,
    },
    async (req, res) => {
      const query = req.query

      const filters = {
        ...buildFilters(query, nftQueryableFields),
        ...buildAttributeFilters(query),
      }

      const domainPageQuery: DomainPageQuery<NFT> = {
        ...basePageQuery(query),
        filters,
      }

      return readPage('nft', { ...domainPageQuery, include: [] })
    }
  )
}
