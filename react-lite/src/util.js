/**
 * 工具箱
 */

// 事件系统
import {
    addEvent,
    removeEvent
} from './event-system'

// CSS属性操作器
import {
    setStyle,
    removeStyle,
    patchStyle
} from './CSSPropertyOperations.js'

// DOM属性操作器
import {
    setPropValue,
    removePropValue
} from './DOMPropertyOperations'

// 常量
import {
    HTML_KEY
} from './constant'



/**
 * 判断obj是否为函数
 * @param {Any} obj
 * @returns {Boolean} 返回true,表示是函数
 */
export function isFn(obj) {
    return typeof obj === 'function'
}

/**
 * 判断是否为数组
 */
export let isArr = Array.isArray

/**
 * 空函数
 */
export function noop() { }

/**
 * 不做任何操作 , 原样返回
 * @param {Any} obj
 * @returns {Any} 返回obj
 */
export function identity(obj) {
    return obj
}

/**
 * pipe , 串联执行f1和f2
 * @param {Function} f1
 * @param {Function} f2
 * @returns {Function} 返回一个包装函数 , 函数会先执行f1,然后执行f2 并将f2的返回只作为函数的返回值
 */
export function pipe(fn1, fn2) {
    return function () {
        fn1.apply(this, arguments)
        return fn2.apply(this, arguments)
    }
}

/**
 * 将item添加到list中
 * @param {Array} list 列表
 * @param {Any} item 列表项
 */
export function addItem(list, item) {
    list[list.length] = item
}

/**
 * 递归遍历所有数组 ( 如果列表项是数组的化 , 迭代调用flatEach )
 * 
 * @example
 * // 1,2,3,a,b,c,d
 * flatEach([[1,2,3],['a','b',['c','d']]],it=>console.log(it))
 * 
 * @param {Array} list 待迭代的数组
 * @param {Function} iteratee 迭代器 (extraArg)=>void
 * @param {Any} extraArg 额外的参数
 */
export function flatEach(list, iteratee, extraArg) {
    let len = list.length
    let i = -1

    while (len--) {
        let item = list[++i]
        if (isArr(item)) {

            // 迭代调用
            flatEach(item, iteratee, extraArg)
        } else {

            // 调用迭代器
            iteratee(item, extraArg)
        }
    }
}

/**
 * 类似Object.assign
 * 
 * 将from对象合并到to对象中
 * 
 * @param {Object} to 
 * @param {Object} from
 * @returns {Object} 返回合并之后的对象
 */
export function extend(to, from) {
    if (Object.assign) {
        return Object.assign(to, from)
    }

    if (!from) {
        return to
    }

    var keys = Object.keys(from)
    var i = keys.length

    while (i--) {
        to[keys[i]] = from[keys[i]]
    }

    return to
}

let uid = 0
/**
 * 获得自增ID
 * @returns {Number} 返回自增ID
 */
export function getUid() {
    return ++uid
}

export let EVENT_KEYS = /^on/i


const createPropHandler = (key, isCustomComponent) => {
    if (EVENT_KEYS.test(key)) return eventPropHandler
    if (key === 'style') return cssPropHandler
    if (key === HTML_KEY) return htmlPropHandler
    if (isCustomComponent) return customPropHandler

    return domPropHandler
}

const eventPropHandler = {
    setProp(elem, key, value) {
        addEvent(elem, key, value)
    },
    removeProp(elem, key) {
        removeEvent(elem, key)
    }
}

const cssPropHandler = {
    setProp(elem, key) {
        setStyle(elem.style, key)
    },
    removeProp(elem, key, oldValue) {
        removeStyle(elem.style, oldValue)
    }
}

const htmlPropHandler = {
    setProp(elem, key, value) {
        if (value && value.__html != null) {
            elem.innerHTML = value.__html
        }
    },
    removeProp(elem, key) {
        elem.innerHTML = ''
    }
}

const customPropHandler = {
    setProp(elem, key, value) {
        value == null
            ? elem.removeAttribute(key)
            : elem.setAttribute(key, '' + value)
    },
    removeProp(elem, key) {
        elem.removeAttribute(key)
    }
}

const domPropHandler = {
    setProp(elem, key, value) {
        setPropValue(elem, key, value)
    },
    removeProp(elem, key) {
        removePropValue(elem, key)
    }
}

/**
 * 设置元素指定属性的值
 * 
 * @param {DOMElement} elem 元素
 * @param {String} key 属性的名称
 * @param {Any} value 属性的值
 * @param {Boolean} [isCustomComponent] 是否为自定义组件
 * 
 * @private
 */
function setProp(elem, key, value, isCustomComponent) {
    createPropHandler(key, isCustomComponent).setProp(elem, key, value)

    // if (EVENT_KEYS.test(key)) {
    //     addEvent(elem, key, value)
    // } else if (key === 'style') {
    //     setStyle(elem.style, value)
    // } else if (key === HTML_KEY) {
    //     if (value && value.__html != null) {
    //         elem.innerHTML = value.__html
    //     }
    // } else if (isCustomComponent) {
    //     if (value == null) {
    //         elem.removeAttribute(key)
    //     } else {
    //         elem.setAttribute(key, '' + value)
    //     }
    // } else {
    //     setPropValue(elem, key, value)
    // }
}

/**
 * 删除元素的指定属性
 * 
 * @param {DOMElement} elem 元素
 * @param {String} key 属性的名称
 * @param {Any} [oldValue] 旧值 , 只有style属性才会有
 * @param {Boolean} [isCustomComponent] 是否为自定义组件 
 * 
 * @private
 */
function removeProp(elem, key, oldValue, isCustomComponent) {
    createPropHandler(key, isCustomComponent).removeProp(elem, key, oldValue)

    // if (EVENT_KEYS.test(key)) {
    //     removeEvent(elem, key)
    // } else if (key === 'style') {
    //     removeStyle(elem.style, oldValue)
    // } else if (key === HTML_KEY) {
    //     elem.innerHTML = ''
    // } else if (isCustomComponent) {
    //     elem.removeAttribute(key)
    // } else {
    //     removePropValue(elem, key)
    // }
}

/**
 * 合并更新元素的属性值
 * 
 * @param {DOMElement} elem 元素
 * @param {String} key 属性的名称
 * @param {Any} value 新值
 * @param {Any} [oldValue] 旧值
 * @param {Boolean} [isCustomComponent] 是否为自定义组件 
 * 
 * @private
 */
function patchProp(elem, key, value, oldValue, isCustomComponent) {

    // 如果 , 属性为 value 或 checked
    // 那么 , 应该取元素的对应的属性值作为旧值
    if (key === 'value' || key === 'checked') {
        oldValue = elem[key]
    }

    // 如果 , 相等
    // 那么 , 退出执行
    if (value === oldValue) {
        return
    }

    // 如果 , value = undefined
    // 那么 , 删除该属性值
    if (value === undefined) {
        removeProp(elem, key, oldValue, isCustomComponent)
        return
    }

    if (key === 'style') {
        
        // 如果是样式属性 , 进行属性patch
        patchStyle(elem.style, oldValue, value)
    } else {

        // 如果是其他属性 , 将旧值替换为新值
        setProp(elem, key, value, isCustomComponent)
    }
}

/**
 * 将属性集合props设置到元素elem上 ( 不对 属性chilren进行操作 )
 * 
 * @param {DOMElement} elem 元素
 * @param {Object} props 属性集合
 * @param {Boolean} [isCustomComponent] 是否为自定义组件
 * 
 * @public
 */
export function setProps(elem, props, isCustomComponent) {
    for (let key in props) {
        if (key !== 'children') {
            setProp(elem, key, props[key], isCustomComponent)
        }
    }
}

/**
 * 更新元素elem的属性 ( 不对 属性chilren进行操作 )
 * 
 * 如果props中有 newProps有 , 合并更新属性
 * 如果props中无 newProps有 , 新增属性
 * 如果props中有 newProps无 , 删除属性
 * 
 * @param {DOMElement} elem 元素
 * @param {Object} props 属性集合 
 * @param {Object} newProps 新的属性集合
 * @param {Boolean} [isCustomComponent] 是否为自定义组件
 * 
 * @public
 */
export function patchProps(elem, props, newProps, isCustomComponent) {
    
    // 遍历旧的属性集合 , 对旧属性做相应的更新操作
    for (let key in props) {
        if (key !== 'children') { // 排除children
            if (newProps.hasOwnProperty(key)) {
                // 如果旧属性在新的属性集合中 , 那么进行更新操作
                patchProp(elem, key, newProps[key], props[key], isCustomComponent)
            } else {
                // 如果旧属性不在新的属性集合中 , 那么删除该属性
                removeProp(elem, key, props[key], isCustomComponent)
            }
        }
    }

    // 遍历新的属性集合 , 将不在属性集合中的属性添加到属性集合中
    for (let key in newProps) {
        if (key !== 'children' && !props.hasOwnProperty(key)) {
            // 新增属性
            setProp(elem, key, newProps[key], isCustomComponent)
        }
    }
}

/**
 * 冻结对象 , 被冻结的对象不能扩展和删除属性
 */
if (!Object.freeze) {
    Object.freeze = identity
}