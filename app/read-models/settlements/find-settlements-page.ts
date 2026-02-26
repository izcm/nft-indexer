import { Settlement } from '#app/domain/settlement/types.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { FindPageArgs } from '#app/repos/shared/types.js'

export async function findPage(args: FindPageArgs) {
  const page = settlementRepo.findPage(args)
}

const settlementDTO = (s: Settlement) => ({
  chainId: s.chainId,
  txHash: s.execution.txHash,

  orderHash: s.orderHash,

  seller: s.seller,
  buyer: s.buyer,

  collection: s.collection,
  tokenId: s.tokenId,

  currency: s.currency,
  price: s.price,

  timestamp: secondsToUnixMs(s.execution.block.timestamp),

  executionDetails: s.execution,
})
