import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { Order, OrderKey, OrderRecord, OrderStatus } from './model.js'

/**
 * Order read / write definitions.
 */

export interface OrderPort extends ByKey<OrderRecord, OrderKey>, Pageable<OrderRecord> {
  /**
   * Upsert order. Returns id and whether it was newly created.
   */
  ensure(chainId: number, order: Order): Promise<{ id: any; didUpsert: boolean }>

  /**
   * Update order status (active/filled/cancelled/expired).
   */
  updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }): Promise<void>
}
