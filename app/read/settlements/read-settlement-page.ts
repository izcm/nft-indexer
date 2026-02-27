import { Settlement } from '#app/domain/settlement/types.js'
import { secondsToUnixMs } from '#app/lib/utils/time.js'
import { FindPageArgs } from '#app/repos/shared/types.js'
import { readGenericPage } from '../shared/read-generic-page.js'

export async function readSettlementPage(args: FindPageArgs) {
  const page = await readGenericPage('Settlement', args, { include: ['NFTCollection'] })

  // make settlement into dto and any include object
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
