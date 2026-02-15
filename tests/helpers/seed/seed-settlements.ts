import { settlements } from '#app/db/collections.js'
import { Settlement } from '#app/domain/settlement/types.js'
import { addrOf, bytes32, priceWei } from '#app/lib/utils/evm-primitives.js'

const s = (x: number | bigint) => x.toString()

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export async function seedSettlements(
  chainId: number,
  seed: string,
  count: number,
  now: number = 0,
  overrides: DeepPartial<Settlement> = {}
) {
  const allSettlements: Settlement[] = Array.from({ length: count }).map((_, i) => {
    return {
      chainId,
      orderHash: bytes32(`order:${i}:${seed}`),

      collection: addrOf(`collection:${i}:${seed}`),
      tokenId: s(i),

      seller: addrOf(`seller:${i}:${seed}`),
      buyer: addrOf(`buyer:${i}:${seed}`),

      currency: addrOf(`currency:${i}:${seed}`),
      price: s(priceWei(seed)),

      execution: {
        logIndex: 0,
        txHash: bytes32(`tx:${seed}`),
        block: {
          number: 0,
          timestamp: now,
        },
      },

      metaStatus: 'PENDING',
      ingestedAt: now,

      ...overrides,
    } as Settlement
  })

  return settlements().insertMany(allSettlements)
}
