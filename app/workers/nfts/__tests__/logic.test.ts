import { describe, expect, it } from 'vitest'
import { parseAttributes, parseTokenUri } from '../logic.js'

const fakeTokenUri =
  'data:application/json;base64,eyJuYW1lIjoiTGVnZW5kYXJ5IFByb3RvY29sIFB1cnBsZSBUaHVuZGVyIFN3b3JkIiwiZGVzY3JpcHRpb24iOiJGdWxseSBvbi1jaGFpbiBkbXJrdCBzd29yZCIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJSYXJpdHkiLCJ2YWx1ZSI6IkxlZ2VuZGFyeSJ9LHsidHJhaXRfdHlwZSI6IkNvbG9yIiwidmFsdWUiOiJQcm90b2NvbCBQdXJwbGUifSx7InRyYWl0X3R5cGUiOiJFbGVtZW50IiwidmFsdWUiOiJUaHVuZGVyIn0seyJ0cmFpdF90eXBlIjoiRGFtYWdlIiwidmFsdWUiOiI2MCJ9XSwiaW1hZ2UiOiJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUIzYVdSMGFEMGlOakF3SWlCb1pXbG5hSFE5SWpZd01DSWdkbWxsZDBKdmVEMGlNQ0F3SURZd01DQTJNREFpSUhodGJHNXpQU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeUkrUEhKbFkzUWdkMmxrZEdnOUlqWXdNQ0lnYUdWcFoyaDBQU0kyTURBaUlISjRQU0kyTkNJZ1ptbHNiRDBpSXpCaU1HSXhNQ0l2UGp4amFYSmpiR1VnWTNnOUlqTXdNQ0lnWTNrOUlqTXdNQ0lnY2owaU1qUXdJaUJtYVd4c1BTSWpabVprTnpBd0lpQnZjR0ZqYVhSNVBTSXdMakUxSWk4K1BIQnZiSGxuYjI0Z2NHOXBiblJ6UFNJeU5UQXNNVFV3SURNeE1Dd3hOVEFnTWpjd0xESTJNQ0F6TXpBc01qWXdJREkyTUN3ek9EQWlJR1pwYkd3OUlpTm1aR1V3TkRjaUx6NDhjbVZqZENCNFBTSXlPVEFpSUhrOUlqRXlNQ0lnZDJsa2RHZzlJakl3SWlCb1pXbG5hSFE5SWpJMk1DSWdabWxzYkQwaUkyUXhaRFZrWWlJdlBqeHlaV04wSUhnOUlqSTBNQ0lnZVQwaU16QXdJaUIzYVdSMGFEMGlNVEl3SWlCb1pXbG5hSFE5SWpJd0lpQm1hV3hzUFNJak4yTTFZMlptSWk4K1BISmxZM1FnZUQwaU1qazFJaUI1UFNJek1qQWlJSGRwWkhSb1BTSXhNQ0lnYUdWcFoyaDBQU0l4TURBaUlHWnBiR3c5SWlNM09ETTFNR1lpTHo0OGNtVmpkQ0I0UFNJeU9EVWlJSGs5SWpReU1DSWdkMmxrZEdnOUlqTXdJaUJvWldsbmFIUTlJak13SWlCbWFXeHNQU0lqTjJNMVkyWm1JaTgrUEhSbGVIUWdlRDBpTXpBd0lpQjVQU0kxTURVaUlIUmxlSFF0WVc1amFHOXlQU0p0YVdSa2JHVWlJR1pwYkd3OUlpTTNZelZqWm1ZaUlHWnZiblF0Wm1GdGFXeDVQU0p0YjI1dmMzQmhZMlVpSUdadmJuUXRjMmw2WlQwaU16UWlJR3hsZEhSbGNpMXpjR0ZqYVc1blBTSXlJajVrYlhKcmREd3ZkR1Y0ZEQ0OEwzTjJaejQ9In0='

describe('tokenUri parser', () => {
  it('returns null when string does not pass base64 check', () => {
    const result = parseTokenUri('not:base64')
    expect(result).toBeNull()
  })

  describe('attribute parser', () => {
    const fakeAttributes = () => [
      { trait_type: 'foo', value: 'bar' },
      { trait_type: 'bar', value: 'foo' },
    ]

    it('parses valid input into array of attributes', () => {
      const arr = fakeAttributes()

      const result = parseAttributes(arr)

      expect(result).toHaveLength(arr.length)
    })

    it('returns empty array when input is not array', () => {
      const result = parseAttributes('attributes')
      expect(result).toEqual([])
    })
  })
})
