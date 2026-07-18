import Fastify, { FastifyError } from 'fastify'

import rateLimit from '@fastify/rate-limit'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import websocket from '@fastify/websocket'

// api routes - SETTLEMENTS
import { settlementsQuery } from './routes/settlements/query.js'

// api routes - ORDERS
import { ordersIngest } from './routes/orders/ingest.js'
import { ordersQuery } from './routes/orders/query.js'

// schemas
import { nftCollectionsQuery } from './routes/nft-collections/query.js'
import { orderCreateBody } from './routes/orders/schemas.js'
import { nftsQuery } from './routes/nfts/query.js'
import { healthcheck } from './routes/healthcheck.js'

import { IS_DEMO } from '#app/config/app.js'
import { handleConnection } from '#app/di/write.js'

const app = Fastify({
  logger: true,
  bodyLimit: 64 * 1024,
  requestTimeout: 10_000,
  // reject requests with invalid fields instead of stripping them
  ajv: {
    customOptions: {
      removeAdditional: false,
    },
  },
})

export const start = async () => {
  // === cors ===

  const corsOrigin = IS_DEMO ? true : process.env.CORS_ORIGIN?.split(',')

  await app.register(cors as any, {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: false,
  })

  console.log('[api] CORS origin: ', corsOrigin)

  // === web socket ===

  await app.register(websocket)
  app.get('/websocket', { websocket: true }, handleConnection)

  // === rate limits & security headers ===

  await app.register(rateLimit, {
    max: 350,
    global: true,
    timeWindow: '1 minute',
  })

  app.setNotFoundHandler(
    {
      preHandler: app.rateLimit({
        max: 30,
        timeWindow: '1 minute',
      }),
    },
    function (_, reply) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Route not found',
        statusCode: 404,
      })
    }
  )

  await app.register(helmet)

  // === error handling ===

  app.setErrorHandler((err: FastifyError, req, reply) => {
    req.log.error(err)

    const statusCode = err.statusCode ?? 500

    if (statusCode < 500) {
      return reply.status(statusCode).send({
        error: err.message,
      })
    }

    return reply.status(500).send({
      error: 'Internal server error',
    })
  })

  // === register schemas ===

  app.addSchema(orderCreateBody)

  // === routes ===

  // routes - orders
  app.register(ordersIngest, { prefix: '/api/orders' })
  app.register(ordersQuery, { prefix: '/api/orders' })

  // routes - settlements
  app.register(settlementsQuery, { prefix: '/api/settlements' })

  // routes - nft-collections & nfts
  app.register(nftCollectionsQuery, { prefix: '/api/nft-collections' })
  app.register(nftsQuery, { prefix: '/api/nfts' })

  // routes - healthcheck (demo only)
  if (IS_DEMO) {
    app.register(healthcheck, { prefix: '/api/healthcheck' })
  }

  // === start server ===

  app.listen({ port: 5000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`server listening on ${address}`)
  })
}
