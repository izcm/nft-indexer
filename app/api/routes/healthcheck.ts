// for demo usage
// frontend shows spinner until healthcheck is true (all nfts are indexed)
// since its only for demo healthcheckk we'll simply import from mongo repo directly

import { FastifyInstance } from 'fastify'

import { countHasMeta } from '#app/repos/mongo/nft.repo.js'
import { countSettlements, countHasCallReconstructed } from '#app/repos/mongo/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/mongo/nft-collection.repo.js'
import { ADDR_REGEX } from '#app/domain/constants/regex.js'
import { Address } from '#app/domain/shared/types/eth.js'

type HealthcheckQuery = {
  chainId: number
  collection: string
}

export const healthcheck = (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: HealthcheckQuery }>(
    '/',
    {
      schema: {
        querystring: {
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
      const { chainId, collection } = req.query

      const colAddr = collection as Address
      const col = await nftCollectionRepo.findByKey({ chainId, address: colAddr })

      if (!col?.totalSupply) {
        return reply.status(400).send({ error: 'collection totalSupply not available' })
      }

      const totalSupply = Number(col.totalSupply)
      const [nftIndexed, settlementTotal, settlementReconstructed] = await Promise.all([
        countHasMeta(chainId, colAddr),
        countSettlements(chainId, colAddr),
        countHasCallReconstructed(),
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
