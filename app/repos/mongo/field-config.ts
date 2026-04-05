import { Decimal128 } from 'mongodb'

export type FieldConfig = Record<
  string,
  {
    dbField: string
    toDb?: (v: string) => unknown
  }
>

export const SETTLEMENT_FIELDS_CFG: FieldConfig = {
  price: {
    dbField: 'db.price',
    toDb: (v: string) => Decimal128.fromString(v),
  },
}

export const ORDER_SPECIAL_FIELDS: FieldConfig = {
  'order.price': {
    dbField: 'db.price',
    toDb: (v: string) => Decimal128.fromString(v),
  },
  'order.start': {
    dbField: 'db.start',
    toDb: (v: string) => Number(v),
  },
  'order.end': {
    dbField: 'db.end',
    toDb: (v: string) => Number(v),
  },
}
