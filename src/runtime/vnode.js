import { isArray, isNumber, isString } from "../utils"
export const ShapeFlags = {
  ELEMENT: 1, // 0000000000000001
  TEXT: 1 << 1, // 0000000000000010
  FRAGMENT: 1 << 2, // 0000000000000100
  COMPONENT: 1 << 3, // 0000000000001000
  TEXT_CHILDREN: 1 << 4, // 0000000000001000
  ARRAY_CHILDREN: 1 << 5, // 0000000000100000
  CHILDREN: (1<<4)|(1<<5)
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

/**
 * 
 * @param {string | Object | Text | Fragment} type 
 * @param {Object | null} props 
 * @param {String | Array | null | number} children
 * @returns {VNode} 
 */
export function h (type, props, children) {
  let shapeFlag = 0
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT
  } else {
    shapeFlag = ShapeFlags.COMPONENT
  }
  if(isString(children)||isNumber(children)){
    // a|=b ==> 
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
    children = children.toString()
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  return {
    type,
    props,
    children,
    shapeFlag
  }
}