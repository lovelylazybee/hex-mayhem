function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      result[toCamelCase(key)] = transformKeys(obj[key])
    }
    return result
  }
  return obj
}

export function camelCaseResponse(data: any): any {
  return transformKeys(data)
}
