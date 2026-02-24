import { Chain, createPublicClient, http, PublicClient } from 'viem'
import { anvil } from 'viem/chains'

const RPC_URL = process.env.RPC_URL

// chain.id !== undefined
export type AppClient = PublicClient<any, Chain>

export const anvilClient = createPublicClient({
  chain: anvil,
  transport: http(RPC_URL),
}) as AppClient

export const clientsByChainId: Record<number, AppClient> = {
  [anvilClient.chain.id]: anvilClient,
}
