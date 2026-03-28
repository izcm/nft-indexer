import json from '@a2zb/packages/abis/dmrkt/OrderEngine.json' with { type: 'json' }

// TODO: https://vitest.dev/config/ **define import aliases in vitest config**
import { describe, expect, it } from 'vitest'
import { Abi, encodeFunctionData, getAbiItem, parseSignature } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { dmrktDomain, dmrktTypes, toOrder712 } from '#app/lib/blockchain/eip712.js'

import { decodeSettlementCall } from '../logic.js'

import {
  fakeFill,
  fakeOrderCore,
  fakePrivateKeys,
  fakeReceipt,
  fakeTx,
} from '#tests/helpers/fixtures.js'

describe('parseTxInputs', () => {
  it('parses all tx inputs + recovers signer as expected', async () => {
    const abi = json.abi as Abi

    const settleFunc = getAbiItem({
      abi,
      name: 'settle',
    })

    if (!settleFunc) throw new Error('did not find settle function in provided abi')

    // arrange
    const order = fakeOrderCore()
    const fill = fakeFill()

    const signerAcount = privateKeyToAccount(fakePrivateKeys.signer)
    const sig = await signerAcount.signTypedData({
      domain: dmrktDomain,
      types: dmrktTypes,
      primaryType: 'Order',
      message: toOrder712(order),
    })

    const encodedData = encodeFunctionData({
      abi,
      functionName: 'settle',
      args: [fill, order, parseSignature(sig)],
    })

    const tx = fakeTx(encodedData)
    const receipt = fakeReceipt

    // act
    const meta = await decodeSettlementCall(tx, receipt, abi)

    // assert
    expect(meta.txInput.order).toEqual(order)
    expect(meta.txInput.fill).toEqual(fill)
    expect(meta.txInput.signer).toBe(signerAcount.address)
  })
})
