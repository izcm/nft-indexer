import { settlements } from '#app/db/collections.js'
import { Settlement } from '#app/domain/settlement/types.js'
import { addrOf, bytes32, priceWei } from '#tests/helpers/evm-primitives.js'
import { applyDeepPartial, type DeepPartial } from '#app/lib/utils/deep-partial.js'
import { base } from 'viem/chains'

const s = (x: number | bigint) => x.toString()

export async function seedSettlements(
  chainId: number,
  seed: string,
  count: number,
  now: number = 0,
  overrides: DeepPartial<Settlement> = {}
) {
  const allSettlements: Settlement[] = Array.from({ length: count }).map((_, i) => {
    const base = {
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

        callReconstruction: {
          status: 'PENDING',
        },
      },

      ingestedAt: now,
    } as Settlement

    return applyDeepPartial(base, overrides)
  })

  return settlements().insertMany(allSettlements)
}
