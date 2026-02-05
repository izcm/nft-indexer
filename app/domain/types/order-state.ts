export type OrderStatus = 'active' | 'filled' | 'cancelled' | 'expired'

export type OrderState = {
  chainId: number
  orderHash: string
  status: OrderStatus
  updatedAt: number
}
