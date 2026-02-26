export function convertBigintsDeep<T>(obj: T): T {
  // bigint => string
  if (typeof obj === 'bigint') {
    return obj.toString() as T
  }

  // array => map each element
  if (Array.isArray(obj)) {
    return obj.map(v => convertBigintsDeep(v)) as T
  }

  // object => recurse keys
  if (obj !== null && typeof obj === 'object') {
    const result: any = {}

    for (const key in obj as any) {
      result[key] = convertBigintsDeep((obj as any)[key])
    }

    return result
  }

  // primitive => leave unchanged
  return obj
}
