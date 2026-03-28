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
      let filters: Record<string, unknown> = { ...req.query }

      const rawTraits = query.trait
      const rawValues = query.value

      const traits = Array.isArray(rawTraits)
        ? rawTraits
        : typeof rawTraits === 'string'
          ? rawTraits.split(',')
          : []

      const values = Array.isArray(rawValues)
        ? rawValues
        : typeof rawValues === 'string'
          ? rawValues.split(',')
          : []

      if (traits.length || values.length) {
        if (traits.length !== values.length) {
          return res.status(400).send({
            message: 'trait/value length mismatch',
          })
        }

        filters.attributes = traits.map((trait, i) => ({
          trait,
          value: values[i],
        }))

        delete filters.trait
        delete filters.value
      }

      const domainPageQuery: DomainPageQuery<NFT> = {
        ...basePageQuery(query),
        filters,
      }

      return readPage('nft', { ...domainPageQuery, include: [] })
    }
  )
}
