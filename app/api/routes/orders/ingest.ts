import { API_ERRORS } from '#app/domain/constants/api.js'
import type { Order } from '#app/domain/order/types.js'
import { validOrder } from '#app/domain/order/validation.js'
import { orderRepo } from '#app/repos/order.repo.js'
import type { FastifyInstance } from 'fastify'

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

      const { id, didUpsert } = await orderRepo.ensure(chainId, orderCore)
      //void onOrderCreated(chainId, orderCore)

      const code = didUpsert ? 201 : 200

      res.code(code).header('Location', `/api/orders/${id}`)

      return {
        id,
      }
    }
  )
}
