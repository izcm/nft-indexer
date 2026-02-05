import { nftCollectionStatsRepo as statsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'
import { orderRepoFor } from '#app/repos/order.repo.js'
import { Hex } from 'viem'
import { statusNetworkSepolia } from 'viem/chains'

// call when settlement.timestamp is unknown to caller
export async function applyOrderFilledBySettlement(chainId: number, orderHash: Hex) {}

// when caller knows settlement block.timestamp
export async function applyOrderFilled(chainId: number, orderHash: Hex, filledAt: number) {
  const orderRepo = orderRepoFor(chainId)

  // upsert orderState
  await orderRepo.markFilled(orderHash)

  // order itself may or may not be registered in our db
  const orderRecord = await orderRepo.findByHash(orderHash)

  // skip stat update if order record missing
  if (!orderRecord) {
    return
  }

  const { side, isCollectionBid, collection } = orderRecord.order

  void statsRepo.recordOrderFilled({
    chainId,
    collection,
    side,
    isCollectionBid,
    timestamp: filledAt,
  })
}
