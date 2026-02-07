import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyOrderFilled } from '#app/domain/actions/order/apply-filled.js'

const findByHash = vi.fn()
const markFilled = vi.fn()

vi.mock('#app/repos/order.repo.js', () => ({
  orderRepoFor: () => ({ findByHash, markFilled }),
}))

const fmtError = (fnName: string) => `[order:filled] ${fnName} failed`

describe('applyOrderFilled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if order missing', async () => {
    findByHash.mockResolvedValueOnce(null)

    await applyOrderFilled(1, '0xabc' as any)

    expect(markFilled).not.toHaveBeenCalled()
  })

  it('throws with tag if markFilled fails', async () => {
    findByHash.mockResolvedValueOnce({ hash: '0xabc' })
    markFilled.mockRejectedValueOnce(new Error('db down'))

    const expectedError = fmtError('markFilled')

    await expect(applyOrderFilled(1, '0xabc')).rejects.toThrow(expectedError)
  })

  it('calls markFilled once when order exists', async () => {
    findByHash.mockResolvedValueOnce({ hash: '0xabc' })

    await applyOrderFilled(1, '0xabc')

    expect(markFilled).toHaveBeenCalledTimes(1)
    expect(markFilled).toHaveBeenCalledWith('0xabc')
  })
})
