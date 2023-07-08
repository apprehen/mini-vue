import { effect } from "./reactive/effect";
import { reactive } from "./reactive/reactive";
import { ref } from "./reactive/ref";
const observed = (window.observed=reactive({ count: 0 }))
const foo = (window.foo=ref(1))
effect(() => {
  console.log('EXPLOSIONING ' + foo.value)
})