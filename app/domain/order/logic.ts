import { OrderType, Side, SideLabel } from './types.js'

export const toOrderType = (side: number, isCollectionBid: boolean): OrderType => {
  const direction = Side[side] as SideLabel
  return direction === 'BID' && isCollectionBid ? 'COLLECTION_BID' : direction
}
