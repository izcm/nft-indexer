import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

// TODO: https://vitest.dev/config/ **define import aliases in vitest config**
import { describe, expect, it, vi } from 'vitest'

import { privateKeyToAccount } from 'viem/accounts'
import { Abi, encodeFunctionData, getAbiItem, Hex, parseSignature } from 'viem'

import { settlementMetaFromTx } from '#app/workers/settlements/logic.js'

import { Side, SideLabel } from '#app/domain/types/order.js'
import { dmrktDomain, toOrder712, dmrktTypes } from '#app/lib/blockchain/eip712.js'

// test helpers

import {
  mockPrivateKeys,
  mockTx,
  mockReceipt,
  mockFill,
  mockOrder,
} from '#tests/mocks/primitives.js'

describe('tx input => SettlementMeta extraction', () => {
  it('recovers signer + other order attributes ', async () => {
    const abi = json.abi as Abi

    const settleFunc = getAbiItem({
      abi,
      name: 'settle',
    })

    expect(settleFunc).toBeDefined()

    // mock inputs
    const order = mockOrder()
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

    expect(meta.order.side).toBe(Side[order.side] as SideLabel)
    expect(meta.order.signer).toBe(signerAcount.address)
  })
})
