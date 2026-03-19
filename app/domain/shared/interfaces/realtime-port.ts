import type { OrderKey } from '#app/domain/order/model.js'
import type { SettlementKey } from '#app/domain/settlement/model.js'

export type Events = {
  'settlement.created': SettlementKey
  'order.created': OrderKey
}

export interface RealtimePort {
  broadcast<E extends keyof Events>(event: E, payload: Events[E]): void
}
