import { Settlement } from '#app/domain/settlement/model.js'
import { applyDeepPartial, type DeepPartial } from '#app/lib/utils/deep-partial.js'

import { addrOf, bytes32, priceWei } from '#tests/helpers/evm-fixtures.js'

const s = (x: number | bigint) => x.toString()

export function buildFakeSettlements(
  chainId: number,
  seed: string,
  count: number,
  now: number = 0,
  overrides: DeepPartial<Settlement> = {}
): Settlement[] {
  return Array.from({ length: count }).map((_, i) => {
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

      updatedAt: now,
      createdAt: now,
    } as Settlement

    return applyDeepPartial(base, overrides)
  })
}
