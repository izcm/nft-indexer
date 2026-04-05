import { describe, expect, it } from 'vitest'
import { buildMongoFilters } from '../build-mongo-filters.js'

it('maps single filter to equality', () => {
  const result = buildMongoFilters({ status: 'active' })

  expect(result).toEqual({ status: 'active' })
})
