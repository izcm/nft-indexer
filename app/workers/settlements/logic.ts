import { decodeFunctionData, serializeSignature, recoverTypedDataAddress, getAbiItem } from 'viem'
import type { AbiFunction, Abi, Hex } from 'viem'

// order types & methods
import { OrderCore, OrderSignature, Side, SideLabel } from '#app/domain/order/types.js'

// domain types
import { SettlementMeta } from '#app/domain/settlement/types.js'

import { dmrktDomain, dmrktTypes, toOrder712 } from '#app/lib/blockchain/eip712.js'

export const settlementMetaFromTx = async (
  tx: any,
  receipt: any,
  abi: Abi
): Promise<SettlementMeta> => {
  if (!tx.to) {
    throw new Error('[settlement-meta] unexpected contract creation tx')
  }

  const selector = tx.input.slice(0, 10) as Hex

  const fnMatch = getAbiItem({
    abi,
    name: selector,
  }) as AbiFunction

  if (!fnMatch) {
    throw new Error('[settlement-meta] given abi has no match for tx function selector')
  }

  const { args } = decodeFunctionData({
    abi,
    data: tx.input,
  })

  if (!args) {
    throw new Error('[settlement-meta] no args found when parsing tx.inputs')
  }

  const [, order, sig] = args as [unknown, OrderCore, OrderSignature]

  if (!order || !sig) {
    throw new Error('[settlement-meta] error parsing ORDER or SIGNATURE')
  }

  const sigHex = serializeSignature({ r: sig.r as Hex, s: sig.s as Hex, v: BigInt(sig.v) })

  const signer = await recoverTypedDataAddress({
    domain: dmrktDomain,
    types: dmrktTypes,
    primaryType: 'Order',
    message: toOrder712(order),
    signature: sigHex,
  })

  const direction = Side[order.side] as SideLabel
  const side = direction === 'BID' && order.isCollectionBid ? 'COLLECTION_BID' : direction

  return {
    order: {
      side: Side[order.side] as SideLabel,
      signer: signer,
    },
    txContext: {
      index: tx.transactionIndex,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      functionSelector: tx.input.slice(0, 10) as `0x${string}`,
      functionName: fnMatch.name,
      contractAddress: tx.to,
    },
  }
}
