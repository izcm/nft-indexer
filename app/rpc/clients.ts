import { createPublicClient, http, PublicClient } from 'viem'
import { anvil } from 'viem/chains'

const RPC_URL = process.env.RPC_URL

export const anvilClient = createPublicClient({
  chain: anvil,
  transport: http(RPC_URL),
})

export const clientsByChainId: Record<number, PublicClient> = {
  [anvilClient.chain.id]: anvilClient,
}
