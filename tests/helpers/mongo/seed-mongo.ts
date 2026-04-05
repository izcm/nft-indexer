import { nftCollections, orders, settlements } from '#app/db/collections.js'

import type { NFTCollection } from '#app/domain/nft-collection/model.js'
import type { Order, OrderRecord, Signature, OrderSide } from '#app/domain/order/model.js'
import type { Settlement } from '#app/domain/settlement/model.js'
import type { DeepPartial } from '#app/lib/utils/deep-partial.js'
import type { Address, Hash } from '#app/domain/shared/types/eth.js'

import { buildFakeNFTCollections } from '../builders/build-nft-collections.js'
import { buildFakeOrders } from '../builders/build-orders.js'
import { buildFakeSettlements } from '../builders/build-settlements.js'
import { toNFTCollectionDoc, toOrderDoc, toSettlementDoc } from './to-doc.js'

const s = (x: number | bigint) => x.toString()

export async function seedOrders(
  chainId: number,
  collections: Address[],
  countPerCollection: number,
  seed: string,
  now: number = 0,
  shapeFn?: (
    i: number
    // seedNum: number
  ) => {
    side: OrderSide
    isCollectionBid: boolean
  },
  overrides: Partial<Omit<OrderRecord, 'order' | 'orderHash'>> = {}
) {
  const orderRecords = await buildFakeOrders(
    chainId,
    collections,
    countPerCollection,
    seed,
    now,
    shapeFn,
    overrides
  )

  return orders().insertMany(orderRecords.map(toOrderDoc))
}

export async function seedSettlements(
  chainId: number,
  seed: string,
  count: number,
  now: number = 0,
  overrides: DeepPartial<Settlement> = {}
) {
  const records = buildFakeSettlements(chainId, seed, count, now, overrides)
  return settlements().insertMany(records.map(toSettlementDoc))
}

export async function seedNFTCollections(
  chainId: number,
  count: number,
  seed: string,
  overrides: Partial<NFTCollection> = {}
) {
  const records = buildFakeNFTCollections(chainId, count, seed, overrides)
  return nftCollections().insertMany(records.map(toNFTCollectionDoc))
}
