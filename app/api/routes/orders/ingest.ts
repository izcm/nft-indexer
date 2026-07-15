import type { FastifyInstance } from 'fastify'

import type { Order, OrderCore } from '#app/domain/order/model.js'
import { InvalidOrderError } from '#app/domain/shared/errors.js'

import { orderActions as actions } from '#app/di/write.js'
import { IS_DEMO } from '#app/config/app.js'

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
      config: {
        rateLimit: IS_DEMO
          ? false
          : {
              max: 60,
              timeWindow: '1 minute',
            },
      },
    },
    async (req, res) => {
      const xChainId = req.headers['x-chain-id']

      const order: Order = {
        ...toDomainOrderCore(req.body),
        signature: req.body.signature,
      }

      try {
        const { chainId, orderHash, didUpsert } = await actions.ingestOrder(xChainId, order)
        const code = didUpsert ? 201 : 200

        res.code(code).header('Location', `/api/orders/${chainId}:${orderHash}`)

        return { id: `${chainId}:${orderHash}` }
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

// convert start + end to string (orderbook fields are uint64)
function toDomainOrderCore(body: CreateOrderRequest): OrderCore {
  const { start, end, ...rest } = body
  return {
    ...rest,
    start: start.toString(),
    end: end.toString(),
  }
}
