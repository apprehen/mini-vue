export function isObject(val) {
  // 类型是null 类型是object
  return typeof val === 'object' && val !== null
}

export function haschanged(oldValue, newValue) {
  return oldValue !== newValue && !(Number.isNaN(oldValue) && Number.isNaN(newValue))
}

export function isArray(target){
  return Array.isArray(target)
}

export function isString(target){
  return typeof target === 'string'
}

export function isNumber (target) {
  return typeof target === 'number'
}

export function isBoolean (target) {
  return typeof target === 'boolean'
}

export function isFunction(target){
  return typeof target === 'function'
}