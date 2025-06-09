export function camelCaseToSnakeCase (obj: any, recursive: boolean = true) {
  const newObj: any = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    const newKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    const value = obj[key]
    const newValue = value !== null && !(value instanceof Date) && typeof value === 'object' && recursive ? camelCaseToSnakeCase(value) : value
    Array.isArray(newObj) ? newObj.push(newValue) : (newObj[newKey] = newValue)
  }

  return newObj
}

export function snakeCaseToCamelCase (obj: any, recursive: boolean = true) {
  const newObj: any = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    const newKey = key.replace(/_([a-z0-9])/g, (letter) => letter.replace('_', '').toUpperCase())
    const value = obj[key]
    const newValue = value !== null && !(value instanceof Date) && typeof value === 'object' && recursive ? snakeCaseToCamelCase(value) : value
    Array.isArray(newObj) ? newObj.push(newValue) : (newObj[newKey] = newValue)
  }

  return newObj
}
