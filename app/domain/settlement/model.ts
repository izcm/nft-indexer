import type { OrderCore } from '../order/model.js'

import { Status } from '../shared/status.js'
import type { Address, ChainEvent, Hash } from '../shared/types/eth.js'
import type { BlockRef, TxContext } from '../shared/types/eth.js'
import type { WithTimestamps } from '../shared/types/with-timestamps.js'

export type SettlementKey = {
  chainId: number
  orderHash: Hash
}

export const settlementKeyOf = (settlement: Settlement): SettlementKey => ({
  chainId: settlement.chainId,
  orderHash: settlement.orderHash,
})

export type Settlement = SettlementKey &
  WithTimestamps & {
    collection: Address
    tokenId: string

    seller: Address
    buyer: Address

    currency: Address
    price: string

    execution: ChainEvent & {
      callReconstruction: {
        status: Status
        error?: string
        data?: SettlementCall
      }
    }
  }

export type NewSettlement = Omit<Settlement, keyof WithTimestamps>

// atomic metadata eg. fetched in one request ( no partial data )
export type SettlementCall = {
  txContext: TxContext

  txInput: {
    order: OrderCore
    fill: {
      tokenId: string
      actor: Address
    }
    signer: Address
  }
}

// --- query layer ---

export const SETTLEMENT_SORT_FIELDS = ['ingestedAt'] as const
export type SettlementSortField = (typeof SETTLEMENT_SORT_FIELDS)[number]
