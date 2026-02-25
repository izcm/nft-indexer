import type { FastifyInstance } from 'fastify'
import { ingestOrder } from '#app/domain/order/actions.js'
import type { Order } from '#app/domain/order/types.js'
import { InvalidOrderError } from '#app/domain/shared/errors.js'

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

      try {
        const { id, didUpsert } = await ingestOrder(chainId, orderCore)

        const code = didUpsert ? 201 : 200

        res.code(code).header('Location', `/api/orders/${id}`)

        return {
          id,
        }
      } catch (err) {
        if (err instanceof InvalidOrderError) {
          return res.code(400).send(err.message)
        }
        throw err
      }
    }
  )
}
