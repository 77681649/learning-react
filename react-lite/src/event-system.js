/**
 * 事件系统
 * event-system
 */

import { updateQueue } from './Component'
import * as _ from './util'

/**
 * 不冒泡的事件集合
 * @const {Object}
 * @public
 */
export const unbubbleEvents = {
    /**
     * should not bind mousemove in document scope
     * even though mousemove event can bubble
     */
    onmousemove: 1,
    onmouseleave: 1,
    onmouseenter: 1,
    onload: 1,
    onunload: 1,
    onscroll: 1,
    onfocus: 1,
    onblur: 1,
    onrowexit: 1,
    onbeforeunload: 1,
    onstop: 1,
    ondragdrop: 1,
    ondragenter: 1,
    ondragexit: 1,
    ondraggesture: 1,
    ondragover: 1,
    oncontextmenu: 1
}

/**
 * 根据属性键 , 获得对应的事件名称
 * @param {String} key 属性键
 * @returns {String}
 * 
 * @public
 */
export function getEventName(key) {
    if (key === 'onDoubleClick') {
        key = 'ondblclick'
    } else if (key === 'onTouchTap') {
        key = 'onclick'
    }

    return key.toLowerCase()
}


// Mobile Safari does not fire properly bubble click events on
// non-interactive elements, which means delegated click listeners do not
// fire. The workaround for this bug involves attaching an empty click
// listener on the target node.
let inMobile = 'ontouchstart' in document
let emptyFunction = () => {}
let ON_CLICK_KEY = 'onclick'

/**
 * 
 * @type {Object}
 * @private
 */
let eventTypes = {}

/**
 * 添加事件
 * @param {HTMLElement} elem 元素
 * @param {String} eventType 事件类型
 * @param {Function} listener 监听器
 */
export function addEvent(elem, eventType, listener) {
    eventType = getEventName(eventType)

    let eventStore = elem.eventStore || (elem.eventStore = {})
    eventStore[eventType] = listener

    if (unbubbleEvents[eventType] === 1) {
        elem[eventType] = dispatchUnbubbleEvent
        return
    } else if (!eventTypes[eventType]) {
        // onclick -> click
        document.addEventListener(eventType.substr(2), dispatchEvent, false)
        eventTypes[eventType] = true
    }

    // 处理safari的BUG
    if (inMobile && eventType === ON_CLICK_KEY) {
        elem.addEventListener('click', emptyFunction, false)
        return
    }

    let nodeName = elem.nodeName

    if (eventType === 'onchange') {
        addEvent(elem, 'oninput', listener)
    }
}

/**
 * 移除事件
 * @param {HTMLElement} elem 元素
 * @param {String} eventType 事件类型
 * 
 * @public
 */
export function removeEvent(elem, eventType) {
    eventType = getEventName(eventType)

    let eventStore = elem.eventStore || (elem.eventStore = {})
    delete eventStore[eventType]

    if (unbubbleEvents[eventType] === 1) {
        elem[eventType] = null
        return
    } else if (inMobile && eventType === ON_CLICK_KEY) {
        elem.removeEventListener('click', emptyFunction, false)
        return
    }

    let nodeName = elem.nodeName

    if (eventType === 'onchange') {
        delete eventStore['oninput']
    }
}

/**
 * 分发冒泡的事件
 * @param {Event} event
 * 
 * @private
 */
function dispatchEvent(event) {
    let { target, type } = event
    let eventType = 'on' + type
    let syntheticEvent

    updateQueue.isPending = true
    
    while (target) {
        let { eventStore } = target
        let listener = eventStore && eventStore[eventType]
        if (!listener) {
            target = target.parentNode
            continue
        }
        if (!syntheticEvent) {
            syntheticEvent = createSyntheticEvent(event)
        }
        syntheticEvent.currentTarget = target
        listener.call(target, syntheticEvent)
        if (syntheticEvent.$cancelBubble) {
            break
        }
        target = target.parentNode
    }

    updateQueue.isPending = false
    updateQueue.batchUpdate()
}

/**
 * 分发不冒泡的事件
 * @param {Event} event
 * 
 * @private
 */
function dispatchUnbubbleEvent(event) {
    let target = event.currentTarget || event.target
    let eventType = 'on' + event.type
    let syntheticEvent = createSyntheticEvent(event)
    
    syntheticEvent.currentTarget = target
    updateQueue.isPending = true

    let { eventStore } = target
    let listener = eventStore && eventStore[eventType]
    if (listener) {
    	listener.call(target, syntheticEvent)
    }
    
    updateQueue.isPending = false
    updateQueue.batchUpdate()
}

/**
 * 创建合成之后的Event
 * @param {Event} nativeEvent
 * @returns {SyntheticEvent}
 * 
 * @private
 */
function createSyntheticEvent(nativeEvent) {
    let syntheticEvent = {}
    let cancelBubble = () => syntheticEvent.$cancelBubble = true
    syntheticEvent.nativeEvent = nativeEvent
    syntheticEvent.persist = _.noop
    for (let key in nativeEvent) {
        if (typeof nativeEvent[key] !== 'function') {
            syntheticEvent[key] = nativeEvent[key]
        } else if (key === 'stopPropagation' || key === 'stopImmediatePropagation') {
            syntheticEvent[key] = cancelBubble
        } else {
            syntheticEvent[key] = nativeEvent[key].bind(nativeEvent)
        }
    }
    return syntheticEvent
}
