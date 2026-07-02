import type { ByKey, Countable, Pageable } from '../shared/interfaces/read-commons.js'
import type { PageQuery } from '../shared/types/page.js'
import type { Hash } from '../shared/types/eth.js'
import type { Settlement, SettlementCall, SettlementKey } from './model.js'

/**
 * Settlement read / write definitions.
 */

export interface SettlementPort
  extends ByKey<Settlement, SettlementKey>, Pageable<Settlement>, Countable {
  /**
   * Save settlement. Should error on duplicate chainId + orderHash.
   */
  // todo: this shouldnt throw error + rename it 'ensure'
  save(settlement: Settlement): Promise<any>

  /**
   * Find settlements with pending call reconstruction.
   * Used by background workers to parse tx calldata.
   */
  findPendingCallReconstruction(chainId: number, limit: number): Promise<Settlement[]>

  /**
   * Finalize call reconstruction after successful parse.
   */
  finalizeCallReconstruction(args: SettlementKey & { meta: SettlementCall }): Promise<void>

  /**
   * Mark call reconstruction as failed.
   */
  markCallReconstructionFailed(args: SettlementKey & { error: string }): Promise<void>

  /**
   * Count distinct wallet addresses across buyer and seller fields.
   * Optionally scoped to a subset of settlements via filters.
   */
  countUniqueWallets(filters?: PageQuery['filters']): Promise<number>
}

/**
 * WRAPPER
 * - Prettifies multichain code
 */
export const settlementRepoForChain = (chainId: number, port: SettlementPort) => ({
  findPendingCallReconstruction(limit: number) {
    return port.findPendingCallReconstruction(chainId, limit)
  },

  finalizeCallReconstruction(orderHash: Hash, meta: SettlementCall) {
    return port.finalizeCallReconstruction({ chainId, orderHash, meta })
  },

  markCallReconstructionFailed(orderHash: Hash, error: string) {
    return port.markCallReconstructionFailed({ chainId, orderHash, error })
  },
})
