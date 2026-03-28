import type { NFTAttribute } from '#app/domain/nft/model.js'
import type { OrderRecord } from '#app/domain/order/model.js'
import type { Settlement } from '#app/domain/settlement/model.js'

// --- denormalized mongo docs ---

export type SettlementDoc = Settlement & {
  attributes?: NFTAttribute[] | null
}

export type OrderDoc = OrderRecord & {
  attributes?: NFTAttribute[] | null
}
