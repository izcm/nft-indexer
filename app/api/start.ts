import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import cors from '@fastify/cors'

// api routes - SETTLEMENTS
import { settlementsQuery } from './routes/settlements/query.js'

// api routes - ORDERS
import { ordersIngest } from './routes/orders/ingest.js'
import { ordersQuery } from './routes/orders/query.js'

// schemas
import { nftCollectionsQuery } from './routes/nft-collections/query.js'
import { orderCreateBody } from './routes/orders/schemas.js'
import { nftsQuery } from './routes/nfts/query.js'

const app = Fastify({
  logger: true,
})

// ------------------
// API SERVER
// ------------------

export const start = async () => {
  // === CORS ===

  if (!process.env.CORS_ORIGIN)
    console.log('[api] CORS_ORIGIN not set — allowing all origins (demo only)')

  await app.register(cors as any, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    methods: ['GET', 'POST', 'PUT'],
    credentials: false,
  })

  // === RATE LIMITS ===

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

  // === REGISTER SCHEMAS ===

  app.addSchema(orderCreateBody)

  // === ROUTES ===

  // routes - orders
  app.register(ordersIngest, { prefix: '/api/orders' })
  app.register(ordersQuery, { prefix: '/api/orders' })

  // routes - settlements
  app.register(settlementsQuery, { prefix: '/api/settlements' })

  // routes - nft-collections & nfts
  app.register(nftCollectionsQuery, { prefix: '/api/nft-collections' })
  app.register(nftsQuery, { prefix: '/api/nfts' })

  // === START SERVER ===

  app.listen({ port: 5000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`server listening on ${address}`)
  })
}
