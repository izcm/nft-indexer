import { settlementFromLog as fromLog } from './logic.js'

import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collections/collection.repo.js'

import { ListenerItem } from '../types/context.js'
import { nftCollectionStatsRepo } from '#app/repos/nft-collections/collection-stats.repo.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = fromLog(item.log, item.chainId)
  const { chainId, collection } = settlement

  void settlementRepo.save(settlement)
  void nftCollectionRepo.noteCollection(chainId, collection)

  void nftCollectionStatsRepo.recordSettlement({
    chainId,
    collectionAddress: settlement.collection,
    timestamp: settlement.execution.block.timestamp,
    price: settlement.priceWei,
  })
}
