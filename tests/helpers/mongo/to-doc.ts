import { Decimal128 } from 'mongodb'

import { NFTCollection } from '#app/domain/nft-collection/model.js'
import { OrderRecord } from '#app/domain/order/model.js'
import { Settlement } from '#app/domain/settlement/model.js'
import { OrderDoc, SettlementDoc } from '#app/repos/mongo/docs.js'

import { fakeOrderRecord, fakeSettlement } from '../fixtures.js'

export const fakeOrderDoc = (overrides: Partial<Settlement> = {}) => ({
  ...toOrderDoc(fakeOrderRecord(overrides)),
})

export const fakeSettlementDoc = (overrides: Partial<Settlement> = {}) => ({
  ...toSettlementDoc(fakeSettlement(overrides)),
})

export function toOrderDoc(orderRecord: OrderRecord): OrderDoc {
  const { order: o } = orderRecord

  return {
    ...orderRecord,
    db: {
      price: Decimal128.fromString(o.price),

      // cast for sorting only, domain stays uint64 string
      start: Number(o.start),
      end: Number(o.end),
    },
  }
}

export function toSettlementDoc(settlement: Settlement): SettlementDoc {
  return {
    ...settlement,
    db: {
      price: Decimal128.fromString(settlement.price),
    },
  }
}

export function toNFTCollectionDoc(collection: NFTCollection): NFTCollection {
  return { ...collection }
}
