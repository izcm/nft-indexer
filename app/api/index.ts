import Fastify from 'fastify'
// @ts-ignore
import cors from '@fastify/cors'

// api routes - SETTLEMENTS
import { settlementsQuery } from './routes/settlements/query.js'

// api routes - ORDERS
import { ordersIngest } from './routes/orders/ingest.js'
import { ordersQuery } from './routes/orders/query.js'

// schemas
import { orderCreateBody } from './schemas/order.js'
import { nftCollectionsQuery } from './routes/nft-collections/query.js'

const app = Fastify({
  logger: true,
})

// ------------------
// API SERVER
// ------------------

export const start = async () => {
  await app.register(cors as any, {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'],
    credentials: false,
  })

  // register all defined bodies
  app.addSchema(orderCreateBody)

  // routes - orders
  app.register(ordersIngest, { prefix: '/api/orders' })
  app.register(ordersQuery, { prefix: '/api/orders' })

  // routes - settlements
  app.register(settlementsQuery, { prefix: '/api/settlements' })

  // routes - nft-collections
  app.register(nftCollectionsQuery, { prefix: '/api/nft-collections' })

  app.listen({ port: 5000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`server listening on ${address}`)
  })
}
