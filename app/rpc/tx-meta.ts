import { Hex } from 'viem'
import { AppClient } from './clients.js'

export const getTxMeta = async (
  client: AppClient,
  txHash: Hex
): Promise<{ tx: any; receipt: any }> => {
  const tx = await client.getTransaction({ hash: txHash })
  const receipt = await client.getTransactionReceipt({ hash: txHash })

  return {
    tx,
    receipt,
  }
}
