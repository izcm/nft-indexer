// for demo usage
// frontend shows spinner until healthcheck is true (all nfts are indexed)

import { FastifyInstance } from 'fastify'

import { nfts, nftCollections, settlements } from '#app/db/collections.js'
import { Status } from '#app/domain/shared/status.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'
import { Address } from '#app/domain/shared/types/eth.js'

export const healthcheck = (fastify: FastifyInstance) => {
  // return demo collection if indexed
  fastify.get('/', () => {
    return nftCollections().findOne()
  })

  // collection enrich + backfill progress
  fastify.get<{ Params: { chainId: number; collection: string } }>(
    '/:chainId/:collection',
    {
      schema: {
        params: {
          type: 'object',
          required: ['chainId', 'collection'],
          properties: {
            chainId: { type: 'integer' },
            collection: { type: 'string', pattern: ADDR_REGEX },
          },
        },
      },
    },
    async (req, reply) => {
      const { chainId, collection } = req.params
      const colAddr = collection as Address

      const col = await nftCollections().findOne({ chainId, address: colAddr })

      // sanity check, all demo collections will implement totalupply
      if (!col?.totalSupply) {
        return reply.status(400).send({ error: 'collection totalSupply not available' })
      }

      const totalSupply = Number(col.totalSupply)
      const [nftIndexed, settlementTotal, settlementReconstructed] = await Promise.all([
        nfts().countDocuments({ chainId, collection: colAddr, metaStatus: Status.DONE }),
        settlements().countDocuments({ chainId, collection: colAddr }),
        settlements().countDocuments({ 'execution.callReconstruction.status': Status.DONE }),
      ])

      return {
        nfts: {
          total: totalSupply,
          indexed: nftIndexed,
          done: nftIndexed === totalSupply,
        },
        settlements: {
          total: settlementTotal,
          reconstructed: settlementReconstructed,
        },
      }
    }
  )
}
