import type { ByKey, Countable, Pageable } from '../shared/interfaces/read-commons.js'
import type { Hash, Address, ChainEvent } from '../shared/types/eth.js'
import type { Order, OrderKey, OrderRecord, OrderStatus } from './model.js'

/**
 * Order read / write definitions.
 */

export interface OrderPort extends ByKey<OrderRecord, OrderKey>, Pageable<OrderRecord>, Countable {
  /**
   * Upsert order. Returns id and whether it was newly created.
   */
  ensure(
    chainId: number,
    order: Order
  ): Promise<{ chainId: number; orderHash: Hash; didUpsert: boolean }>

  /**
   * Update order status
   */
  updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }): Promise<void>

  /**
   * Cancel order when listener picks up `OrderCancelled` event
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

  /**
   * An order is only filled on-chain
   * When listener picks up `Settlement` event => pass orderHash + chainEvent to mark as filled
   */
  markOrderFilled({
    chainId,
    orderHash,
    chainEvent,
  }: {
    chainId: number
    orderHash: Hash
    chainEvent: ChainEvent
  }): Promise<void>
}
