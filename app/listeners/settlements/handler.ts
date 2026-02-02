import { settlementFromLog as fromLog } from './logic.js'

import { settlementRepo } from '#app/repos/settlement.repo.js'
import { nftCollectionRepo } from '#app/repos/nft-collection.repo.js'

import { ListenerItem } from '../types/context.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = fromLog(item.log, item.chainId)
  const { chainId, collection } = settlement

  void settlementRepo.save(settlement)
  void nftCollectionRepo.noteCollection(chainId, collection)
}
