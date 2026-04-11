import { describe, expect, it } from 'vitest'
import { buildMongoFilters } from '../build-mongo-filters.js'

describe('buildMongoFilters', () => {
  describe('basic filters', () => {
    it('maps single filter to equality', () => {
      const result = buildMongoFilters({ status: 'active' })

      expect(result).toEqual({ status: 'active' })
    })

    it('maps multiple filter values to $in query', () => {
      const filters = {
        status: ['active', 'cancelled'],
      }

      const result = buildMongoFilters(filters)

      expect(result).toEqual({ status: { $in: ['active', 'cancelled'] } })
    })
  })

  describe('mapping of fields that have special config', () => {
    it('maps field using dbField from fieldConfig', () => {
      const filters = { price: '1000' }

      const result = buildMongoFilters(filters, {
        fieldConfig: {
          price: {
            dbField: 'db.price',
          },
        },
      })

      expect(result).toEqual({ ['db.price']: filters.price })
    })

    it('applies toDb transform on filter values', () => {
      const filters = { price: '1000' }

      const fieldConfig = {
        price: {
          dbField: 'db.price',
          toDb: (v: string) => Number(v),
        },
      }

      const result = buildMongoFilters(filters, {
        fieldConfig,
      })

      expect(result).toEqual({ ['db.price']: fieldConfig.price.toDb(filters.price) })
    })
  })

  // attributes should be in $and branch of result
  describe('attributes', () => {
    const filters = { attributes: [{ trait: 'stamina', value: 'legendary' }] }

    it('does not map attributes as a direct field', () => {
      const result = buildMongoFilters(filters)

      expect(result).not.toHaveProperty('attributes')
      expect(result.$and).toBeDefined()
    })

    it('maps attributes to $elemMatch', () => {
      const { trait, value } = filters.attributes[0]
      const result = buildMongoFilters(filters)

      expect(result.$and).toEqual([
        {
          attributes: {
            $elemMatch: {
              trait_type: trait,
              value,
            },
          },
        },
      ])
    })

    it('groups attribute values into $in', () => {
      const extendedFilter = { attributes: [{ trait: 'stamina', value: ['epic', 'legendary'] }] }

      const { trait, value: values } = extendedFilter.attributes[0]
      const result = buildMongoFilters(extendedFilter)

      expect(result.$and).toEqual([
        {
          attributes: {
            $elemMatch: {
              trait_type: trait,
              value: { $in: values },
            },
          },
        },
      ])
    })

    it('handles multiple traits', () => {
      const filters = {
        attributes: [
          { trait: 'stamina', value: ['epic', 'legendary'] },
          { trait: 'rarity', value: 'rare' },
        ],
      }

      const result = buildMongoFilters(filters)

      expect(result.$and).toEqual([
        {
          attributes: {
            $elemMatch: {
              trait_type: 'stamina',
              value: { $in: ['epic', 'legendary'] },
            },
          },
        },
        {
          attributes: {
            $elemMatch: {
              trait_type: 'rarity',
              value: 'rare',
            },
          },
        },
      ])
    })
  })

  describe('or filters', () => {
    it('maps accepted fields to $or expression', () => {})
  })

  describe('range', () => {
    const opts = { from: 0, to: 10, rangeField: 'start' }

    it('applies range query with $gte/$lte', () => {
      const result = buildMongoFilters({}, opts)
      expect(result.start).toEqual({ $gte: 0, $lte: 10 })
    })

    it('applies range query using mapped dbField', () => {
      const fieldConfig = {
        start: {
          dbField: 'db.start',
        },
      }

      const result = buildMongoFilters({}, { ...opts, fieldConfig })

      expect(result['db.start']).toEqual({ $gte: 0, $lte: 10 })
    })
  })

  it('merges filters, attributes, and range', () => {
    const filters = {
      status: 'active',
      attributes: [{ trait: 'stamina', value: ['epic', 'legendary'] }],
    }

    const opts = {
      from: 0,
      to: 10,
      rangeField: 'start',
    }

    const result = buildMongoFilters(filters, opts)

    expect(result).toEqual({
      status: 'active',
      start: { $gte: 0, $lte: 10 },
      $and: [
        {
          attributes: {
            $elemMatch: {
              trait_type: 'stamina',
              value: { $in: ['epic', 'legendary'] },
            },
          },
        },
      ],
    })
  })
})
