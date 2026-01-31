import { PublicClient } from 'viem'
import { runSettlementWorker } from './settlements/runner.js'

// ------------------
// WORKERS
// ------------------

export const start = (client: PublicClient) => {
  setInterval(async () => {
    try {
      await runSettlementWorker(client)
    } catch (e) {
      console.error('[workers] meta worker crashed', e)
    }
  }, 10_000)
}
