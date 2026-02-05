import { FastifyInstance } from 'fastify'

import { API_ERRORS } from '#app/domain/constants/api.js'
import { Order, Side, SideLabel, validOrder } from '#app/domain/types/order.js'

import { orderRepo as orderRepo } from '#app/repos/order.repo.js'
import { nftCollectionStatsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'

// TODO: index orderhash on `order_status`
export const ordersIngest = (fastify: FastifyInstance) => {
  fastify.post<{ Headers: { 'x-chain-id': number }; Body: Order }>(
    '/',
    {
      schema: {
        headers: {
          type: 'object',
          required: ['x-chain-id'],
          properties: { 'x-chain-id': { type: 'number' } },
        },
        body: { $ref: 'order-create#' },
      },
    },
    async (req, res) => {
      const order = req.body
      const chainId = req.headers['x-chain-id']

      if (!validOrder(order, Math.floor(Date.now() / 1000))) {
        res.code(400)
        return API_ERRORS.INVALID_ORDER
      }

      const insertedId = await orderRepo.save(chainId, order)

      // todo: for fire and forget => todo: add bg worker

      const { side, isCollectionBid, collection, start } = order

      void nftCollectionStatsRepo
        .recordOrderCreated({
          chainId,
          collection,
          isCollectionBid,
          side,
          timestamp: Number(start), // timestamp = unix in seconds enforced in JSON schema
        })
        .catch(err => {
          fastify.log.error(
            { err, chainId, collection },
            '[order:ingest]: failed to record collection stats'
          )
        })

      res.code(201).header('Location', `/api/orders/${insertedId}`)

      return insertedId
    }
  )
}
