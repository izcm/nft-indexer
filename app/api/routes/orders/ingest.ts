import type { FastifyInstance } from 'fastify'
import { ingestOrder } from '#app/domain/order/actions.js'
import type { Order, OrderCore } from '#app/domain/order/model.js'
import { InvalidOrderError } from '#app/domain/shared/errors.js'
import type { Address, Hash } from '#app/domain/shared/types/eth.js'

export const ordersIngest = (fastify: FastifyInstance) => {
  fastify.post<{ Headers: { 'x-chain-id': number }; Body: CreateOrderRequest }>(
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
      const chainId = req.headers['x-chain-id']

      const order: Order = {
        ...toOrderCore(req.body),
        signature: req.body.signature,
      }

      try {
        const { id, didUpsert } = await ingestOrder(chainId, order)

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

type CreateOrderRequest = Omit<Order, 'start' | 'end'> & {
  start: number
  end: number
}

function toOrderCore(body: CreateOrderRequest): Order {
  const { start, end, ...rest } = body
  return {
    ...rest,
    start: start.toString(),
    end: end.toString(),
  }
}
