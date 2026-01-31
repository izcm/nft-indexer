import { runSettlementWorker } from './settlements/runner.js'
import { AppClient } from '#app/rpc/clients.js'

// ------------------
// WORKERS
// ------------------

export const start = async (client: AppClient) => {
  setInterval(async () => {
    try {
      await runSettlementWorker(client)
    } catch (e) {
      const chainId = client.chain.id
      const reason = e instanceof Error ? e.message : String(e)

      console.error('[workers] settlement worker crashed', { chainId, reason })
    }
  }, 10_000)
}
