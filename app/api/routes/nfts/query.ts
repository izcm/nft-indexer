import { FastifyInstance } from 'fastify'

import { DEFAULT_PAGE_LIMIT } from '#app/domain/constants/limits.js'

import type { NFT, NFTKey } from '#app/domain/nft/model.js'

import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'

export const nftsQuery = (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/:id', async (req, res) => {
    // three-part id chainId:collection:tokenId
    const id = req.params.id

    const arr = id.split(':')

    if (arr.length !== 3) throw new Error('invalid id')

    const [chainId, collection, tokenId] = arr

    if (!chainId || !collection || !tokenId) {
      throw new Error('invalid id')
    }

    const doc = await readByKey('nft', { chainId: Number(chainId), collection, tokenId } as NFTKey)

    if (!doc) {
      res.code(404)
      return
    }

    return doc
  })

  fastify.get<{
    Querystring: HttpPageRequest<NFT, 'nft'> & Record<string, unknown>
  }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
        },
      },
    },
    async req => {
      const q = req.query

      const domainPageQuery: DomainPageQuery<NFT> = {
        limit: q.limit ?? DEFAULT_PAGE_LIMIT,
        sortField: 'createdAt', // todo: dont hardcode...
        sortDir: q.sortDir,
      }

      return readPage('nft', { ...domainPageQuery, include: [] })
    }
  )
}
