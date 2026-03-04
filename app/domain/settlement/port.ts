import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { Settlement, SettlementCall, SettlementKey } from './model.js'

// todo: type return types
// note: dont depend on mongodb eg. make own updateresult type etc.

/* definitions settlement read / write  */

export interface SettlementPort extends ByKey<Settlement, SettlementKey>, Pageable<Settlement> {
  // save should insert one row and throw error for duplicates chainId + orderHash
  save(settlement: Settlement): Promise<any>

  // worker collects tx / tx-receipt & reconstructs call
  // eg. parses tx inputs (calldata)

  // worker finds rows who have their callReconstruction status set to PENDING
  findPendingCallReconstruction(chainId: number, limit: number): Promise<Settlement[]>

  // call reconstruction - on success
  finalizeCallReconstruction(args: SettlementKey & { meta: SettlementCall }): Promise<any>
  // call reconstruction - on error
  markCallReconstructionFailed(args: SettlementKey & { error: string }): Promise<any>
}
