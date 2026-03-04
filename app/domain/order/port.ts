import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { Order, OrderKey, OrderRecord, OrderStatus } from './model.js'

// todo: type return types
// note: dont depend on mongodb eg. make own updateresult type etc.

/* definitions order read / write  */

export interface OrderPort extends ByKey<OrderRecord, OrderKey>, Pageable<OrderRecord> {
  ensure(chainId: number, order: Order): Promise<{ id: any; didUpsert: boolean }>
  updateStatus({ chainId, orderHash, status }: OrderKey & { status: OrderStatus }): Promise<any>
}
