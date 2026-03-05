import type { Abi, AbiFunction, Hex } from 'viem'
import { decodeFunctionData, getAbiItem, recoverTypedDataAddress, serializeSignature } from 'viem'

import type { OrderCore, Signature, SideLabel } from '#app/domain/order/model.js'
import type { Fill, SettlementCall } from '#app/domain/settlement/model.js'

import { dmrktDomain, dmrktTypes, toOrder712 } from '#app/lib/blockchain/eip712.js'

export async function decodeSettlementCall(
  tx: any,
  receipt: any,
  abi: Abi
): Promise<SettlementCall> {
  if (!tx.to) {
    throw new Error('[tx-parser] unexpected contract creation tx')
  }

  const selector = tx.input.slice(0, 10) as Hex

  const fnMatch = getAbiItem({
    abi,
    name: selector,
  }) as AbiFunction

  if (!fnMatch) {
    throw new Error('[tx-parser] given abi has no match for tx function selector')
  }

  const { args } = decodeFunctionData({
    abi,
    data: tx.input,
  })

  if (!args) {
    throw new Error('[tx-parser] no args found when parsing tx.inputs')
  }

  const [fill, order, sig] = args as [Fill, OrderCore, Signature]

  if (!order || !sig) {
    throw new Error('[tx-parser] error parsing ORDER or SIGNATURE')
  }

  const sigHex = serializeSignature({ r: sig.r as Hex, s: sig.s as Hex, v: BigInt(sig.v) })

  const signer = await recoverTypedDataAddress({
    domain: dmrktDomain,
    types: dmrktTypes,
    primaryType: 'Order',
    message: toOrder712(order),
    signature: sigHex,
  })

  return {
    txInput: {
      order,
      fill,
      signer,
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
