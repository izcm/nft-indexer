import { ListenerItem } from '../types/context.js'
import { processSettlement } from '#app/domain/settlement/actions.js'
import { settlementFromLog } from './logic.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'

export function handleSettlement(item: ListenerItem) {
  const settlement = settlementFromLog(item.log, item.chainId)

  // todo: move save into processSettlement (all repo write routes through domain layer)
  void settlementRepo.save(settlement)
  void processSettlement({ ...settlement, timestamp: item.log.blockTimestamp })
}
