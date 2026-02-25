import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }
import { describe, expect, it } from 'vitest'
import { Abi, encodeFunctionData, getAbiItem, parseSignature } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
// TODO: https://vitest.dev/config/ **define import aliases in vitest config**
import { Side, SideLabel } from '#app/domain/order/types.js'
import { dmrktDomain, dmrktTypes, toOrder712 } from '#app/lib/blockchain/eip712.js'
import { settlementMetaFromTx } from '#app/workers/settlements/logic.js'
import {
  mockFill,
  mockOrderCore,
  mockPrivateKeys,
  mockReceipt,
  mockTx,
} from '#tests/mocks/primitives.js'

describe('tx input => SettlementMeta logic', () => {
  it('recovers signer + order attributes ', async () => {
    const abi = json.abi as Abi

    const settleFunc = getAbiItem({
      abi,
      name: 'settle',
    })

    expect(settleFunc).toBeDefined()

    // mock inputs
    const order = mockOrderCore()
    const signerAcount = privateKeyToAccount(mockPrivateKeys.signer) // doesn't need to match order.actor

    const sig = await signerAcount.signTypedData({
      domain: dmrktDomain,
      types: dmrktTypes,
      primaryType: 'Order',
      message: toOrder712(order),
    })

    const fill = mockFill()

    const encodedData = encodeFunctionData({
      abi,
      functionName: 'settle',
      args: [fill, order, parseSignature(sig)],
    })

    // mock chain ctx
    const tx = mockTx(encodedData)
    const receipt = mockReceipt

    // extract meta
    const meta = await settlementMetaFromTx(tx, receipt, abi)

    expect(meta.order.type).toBe(Side[order.side] as SideLabel)
    expect(meta.order.signer).toBe(signerAcount.address)
  })
})
