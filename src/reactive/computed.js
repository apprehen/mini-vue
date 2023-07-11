import { isFunction } from "../utils"
import { effect,track,trigger } from "./effect"
export function computed(getterOrOptions){
  let getter,setter;
  if(isFunction(getterOrOptions)){
    getter = getterOrOptions
    setter = () => {
      console.warn('computed value must be readonly')
    }
  }else{
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter,setter)
}

class ComputedRefImpl{
  constructor(getter,setter){
    this._dirty = true
    this._value = null
    this._setter = setter
    this.effect = effect(getter, {
      lazy: true,
      // 调度机制
      scheduler: () => {
        if(!this._dirty){
          this._dirty = true
          trigger(this, 'value')
        }
      }
    })
  }
  get value(){
    if(this._dirty){
      this._value = this.effect()
      this._dirty = false
    }
    track(this, 'value')
    return this._value
  }
  set value(newValue){
    this._setter(newValue)
  }
}