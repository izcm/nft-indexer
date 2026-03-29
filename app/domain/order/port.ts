import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { Hash, Address, ChainEvent } from '../shared/types/eth.js'
import type { Order, OrderKey, OrderRecord, OrderStatus } from './model.js'

/**
 * Order read / write definitions.
 */

export interface OrderPort extends ByKey<OrderRecord, OrderKey>, Pageable<OrderRecord> {
  /**
   * Upsert order. Returns id and whether it was newly created.
   */
  ensure(
    chainId: number,
    order: Order
  ): Promise<{ chainId: number; orderHash: Hash; didUpsert: boolean }>

  /**
   * Update order status (active/filled/cancelled/expired).
   */
  updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }): Promise<void>

  /**
   * Cancel order on listener picking up on 'OrderCancelled' event
   */
  cancelOrdersByChainIdNonce({
    chainId,
    user,
    nonce,
    cancellation,
  }: {
    chainId: number
    user: Address
    nonce: string
    cancellation: ChainEvent
  }): Promise<{ orderHash: Hash }[]>
}
