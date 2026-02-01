import Fastify from 'fastify'

// api routes - SETTLEMENTS
import { settlementsQuery } from './routes/settlements/query.js'

// api routes - ORDERS
import { ordersIngest } from './routes/orders/ingest.js'
import { ordersQuery } from './routes/orders/query.js'

// schemas
import { orderCreateBody } from './schemas/order.js'

const app = Fastify({
  logger: true,
})

// ------------------
// API SERVER
// ------------------

export const start = async () => {
  // register all defined bodies
  app.addSchema(orderCreateBody)

  // routes - orders
  app.register(ordersIngest, { prefix: '/api/orders' })
  app.register(ordersQuery, { prefix: '/api/orders' })

  // routes - settlements
  app.register(settlementsQuery, { prefix: '/api/settlements' })

  app.listen({ port: 5000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`server listening on ${address}`)
  })
}
