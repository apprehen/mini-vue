// import { effect } from "./reactive/effect";
// import { reactive } from "./reactive/reactive";
// import { ref } from "./reactive/ref";
// const observed = (window.observed=reactive({ count: 0 }))
// const foo = (window.foo=ref(1))
// effect(() => {
//   console.log('EXPLOSIONING ' + foo.value)
// })

import { render,h,Text,Fragment } from "./runtime"

const vnode = h(
  'div',
  {
    class: 'a b',
    style: {
      border: '1px solid red',
      fontSize: '20px'
    },
    onClick: () => {
      console.log('click')
    },
    id: 'foo',
    checked: '',
    custom: false,
  },
  [
    h('ul',null,[
      h('li',{style:{color:'red'}},'1'),
      h('li',{style:{color:'green'}},'2'),
      h('li',{style:{color:'blue'}},'3'),
      h(Fragment,null,[h('li',null,'4'),h('li',null,'5')]),
      h(Text,null,'6'),
      h('li',null,'hello world')
    ])
  ]
)

render(vnode,document.body)