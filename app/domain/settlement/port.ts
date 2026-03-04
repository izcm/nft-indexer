import type { ByKey, Pageable } from '../shared/interfaces/read-commons.js'
import type { Settlement, SettlementCall, SettlementKey } from './model.js'

/**
 * Settlement read / write definitions.
 */

export interface SettlementPort extends ByKey<Settlement, SettlementKey>, Pageable<Settlement> {
  /**
   * Save settlement. Should error on duplicate chainId + orderHash.
   */
  save(settlement: Settlement): Promise<any>

  /**
   * Find settlements with pending call reconstruction.
   * Used by background workers to parse tx calldata.
   */
  findPendingCallReconstruction(chainId: number, limit: number): Promise<Settlement[]>

  /**
   * Finalize call reconstruction after successful parse.
   */
  finalizeCallReconstruction(args: SettlementKey & { meta: SettlementCall }): Promise<any>

  /**
   * Mark call reconstruction as failed.
   */
  markCallReconstructionFailed(args: SettlementKey & { error: string }): Promise<any>
}
