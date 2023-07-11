# 虚拟DOM
划分虚拟DOM种类：
  - Element
  - Text
  - Fragment
  - Components


1. Element:  
   对应普通元素，如div、p、span等,使用doucment.createElement创建,type指定标签名，props指定元素属性，children指定子元素，可以为数组或者字符串，为字符串时代表只有一个文本子节点
  ```javascript
  // 类型定义
  {
    type: string,
    props: Object,
    children: string | VNode[]
  }
  // 例子
  {
    type: 'div',
    props: {
      id: 'app'
    },
    children: 'hello world'
  }
  ```

2. Text:  
   对应文本节点，使用document.createTextNode创建，text指定文本内容
  ```javascript
  {
    type: symbol,
    props: null,
    text: string
  }
  ```

3. Fragment:  
   对应Fragment，不会渲染的节点，相当于templete或react的Fragment，type为symbol，props为null，children为数组表示子节点，最后渲染时会将子节点的所有子节点挂载到Fragment父节点上
  ```javascript
  {
    type: symbol,
    props: null,
    children: VNode[]
  }
  ```
4. Components:  
   Component是组件，组件有自己特殊的一套渲染方法，但组件的最终产物，也是上面三种VNode的集合。组件的type，就是组件定义的对象，props即是外部传入组件的props数据，children是组件的slot
  ```javascript
  // 类型定义
  {
    type: Object,
    props: Object,
    children: null
  }
  // 例子
  {
    type:{
      template: `{{msg}} {{name}}`
      props: ['name'],
      setup(){
        return {
          msg: 'hello'
        }
      }
    },
    props: {
      name: 'world'
    },
  }
  ```

ShaperFlags
  - 一组标记，用于快速识别VNode的类型和他的子节点类型
  - 使用位运算
```
// 例子
// 与运算，只有两个都为1时才为1
0 0 1 0 0 0 1 1
0 0 1 0 1 1 1 1
&
0 0 1 0 0 0 1 1
// 或运算，只要有一个为1就为1
0 0 1 0 0 0 1 1
0 0 1 0 1 1 1 1
|
0 0 1 0 1 1 1 1
```
```javascript
const ShapeFlags = {
  ELEMENT: 1, // 普通元素 00000001
  TEXT: 1 << 1, // 文本节点 00000010
  FRAGMENT: 1 << 2, // Fragment 00000100
  COMPONENT: 1 << 3, // 组件 00001000
  TEXT_CHILDREN: 1 << 4, // 子节点是文本 00010000
  ARRAY_CHILDREN: 1 << 5, // 子节点是数组 00100000
  CHILDREN: (1<<4)|(1<<5) // 子节点是文本或数组
}
```
采用二进制位运算`<<`和`|`,使用时用`&`运算判断,如下:
```javascript
if(flag & ShapeFlags.ELEMENT){
  // 是普通元素
}
let flag = 33
flag & ShapeFlags.ELMENT // 1 true
flag & ShapeFlags.TEXT // 0 false
flag & ShapeFlags.FRAGMENT // 0 false
flag & ShapeFlags.ARRAY_CHILDREN //    true
flag & ShapeFlags.CHILDREN // true
```
生成可以用
```let flag = ShapeFlags.ELEMENT | ShapeFlags.ARRAY_CHILDREN```

VNode的初步形成
```javascript
{
  type,
  props,
  children,
  shapeFlag
}
```

