import { FastifyInstance } from 'fastify'

import { API_ERRORS } from '#app/domain/constants/api.js'
import { Order } from '#app/domain/types/order.js'

import { orderRepo } from '#app/repos/order.repo.js'
import { applyOrderCreated } from '#app/domain/actions/order/apply-created.js'
import { validOrder } from '#app/domain/validation/order.js'

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
      const orderCore = req.body
      const chainId = req.headers['x-chain-id']

      if (!validOrder(orderCore, Math.floor(Date.now() / 1000))) {
        res.code(400)
        return API_ERRORS.INVALID_ORDER
      }

      const insertedId = await orderRepo.save(chainId, orderCore)
      void applyOrderCreated(chainId, orderCore)

      res.code(201).header('Location', `/api/orders/${insertedId}`)

      return insertedId
    }
  )
}
