import type { Abi, AbiFunction, Address, Hash, Hex, Signature } from 'viem'
import { decodeFunctionData, getAbiItem, recoverTypedDataAddress, serializeSignature } from 'viem'

import type { SettlementCall } from '#app/domain/settlement/model.js'

import { dmrktDomain, dmrktTypes, OrderCore712 } from '#app/lib/blockchain/eip712.js'
import { convertBigintsDeep } from '#app/lib/utils/bigint.js'
import { OrderCore } from '#app/domain/order/model.js'

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

  const [fill, order712, sig] = args as [
    { tokenId: bigint; actor: Address },
    OrderCore712,
    { r: Hash; s: Hash; v: bigint },
  ]

  if (!order712 || !sig) {
    throw new Error('[tx-parser] error parsing ORDER or SIGNATURE')
  }

  const sigHex = serializeSignature({ r: sig.r, s: sig.s, v: BigInt(sig.v) })

  const signer = await recoverTypedDataAddress({
    domain: dmrktDomain,
    types: dmrktTypes,
    primaryType: 'Order',
    message: order712,
    signature: sigHex,
  })

  const orderCore = convertBigintsDeep(order712) as unknown as OrderCore

  return {
    txInput: {
      order: orderCore,
      fill: {
        tokenId: fill.tokenId.toString(),
        actor: fill.actor,
      },
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
