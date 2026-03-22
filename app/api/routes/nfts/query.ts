import { FastifyInstance } from 'fastify'

import type { NFT, NFTKey } from '#app/domain/nft/model.js'

import type { HttpPageRequest } from '#app/domain/shared/types/request.js'
import type { DomainPageQuery } from '#app/domain/shared/types/page.js'

import { getOr404 } from '#app/api/shared/get-or-404.js'
import { basePageQuery } from '#app/api/shared/page-query.js'

// --- DI ---
import { readByKey, readPage } from '#app/di/read.js'
import { parseTripleDomainId } from '#app/domain/shared/ids.js'
import { nftPageSchema } from './schema.js'

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

      // parse nft attributes
      //  db.nfts.find({ "attributes.trait_type": "Color", "attributes.value": "Aqua Mint" })
      if (Array.isArray(query.trait) && Array.isArray(query.value)) {
        if (query.trait.length !== query.value.length) {
          return res.status(400).send({
            message: 'trait/value length mismatch',
          })

          const pairs = (query.trait as string[]).map((trait, i) => ({
            ['attributes.trait_type']: trait,
            ['attributes.value']: (query.value as string[])[i],
          }))
        }
      }
      const domainPageQuery: DomainPageQuery<NFT> = {
        ...basePageQuery(query),
        filters: {},
      }

      return readPage('nft', { ...domainPageQuery, include: [] })
    }
  )
}
