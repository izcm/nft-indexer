import { Hex, PublicClient } from 'viem'
import { clientsByChainId } from './clients.js'

const RPC_URL = process.env.RPC_URL

export const getTxMeta = async (
  client: PublicClient,
  txHash: Hex
): Promise<{ tx: any; receipt: any }> => {
  const tx = await client.getTransaction({ hash: txHash })
  const receipt = await client.getTransactionReceipt({ hash: txHash })

  return {
    tx,
    receipt,
  }
}
