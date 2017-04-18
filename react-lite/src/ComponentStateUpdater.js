/**
 * 更新器
 */
import * as updateQueue from './componentUpdateQueue'

const wrappedReplaceState = {}

/**
 * 
 * @param {*} nextState 
 */
const isReplaceState = nextState => nextState === wrappedReplaceState

/**
 * 判断是否应该更新 , 如果应该那么
 * @param {*} component 
 * @param {*} nextProps 
 * @param {*} nextState 
 * @param {*} nextContext 
 * @param {*} callback 
 * 
 * @private
 */
const shouldUpdate = (component, nextProps, nextState, nextContext, callback) => {
  let shouldComponentUpdate = true

  if (component.shouldComponentUpdate) {
    shouldComponentUpdate = component.shouldComponentUpdate(nextProps, nextState, nextContext)
  }

  // 如果为false , 说明无需更新组件 ; 直接保存当前属性,状态,上下文即可
  if (shouldComponentUpdate === false) {
    component.props = nextProps
    component.state = nextState
    component.context = nextContext || {}

    return
  }

  component.updateCacheState(nextProps, nextState, nextContext || {})
  component.forceUpdate(callback)
}



/** 
 * @param {Component} instance 组件实例
 * @class Updater
 */
export default function Updater(instance) {
	/**
   * 更新器的服务实例 ( 组件 )
   * @type {Component}
   */
  this.instance = instance

  /**
   * 存储待处理的"状态更新""
   * @type {Array[String | Function]}
   */
  this.pendingStates = []

  /**
   * 存储待执行的回调函数
   * @type {}
   */
  this.pendingCallbacks = []

  /**
   * 是否准备就绪
   * true  = 等待状态 , 表示当添加状态更新操作时 , 
   * false = 就绪状态 , 表示当添加状态更新操作时 , 可以直接触发更新操作
   * @type {Boolean} 
   * @default false
   */
  this.isPending = false

  /**
   * 
   */
  this.nextProps = this.nextContext = null

  /**
   * 清除回调函数
   */
  this.clearCallbacks = this.clearCallbacks.bind(this)
}

/**
 * 组件状态更新器
 */
Updater.prototype = {
  /**
   * 添加一个"状态更新"
   * @param {any} nextState 
   */
  addState(nextState) {
    if (nextState) {
      this.enPendingQueue(nextState)

      if (!this.isLocked()) {
        this.tryUpdateComponent()
      }
    }
  },

  /**
   * 尝试触发组件更新 
   * 
   * @param {Object?} nextProps 新的属性
   * @param {Object?} nextContext 新的上下文
   */
  tryUpdateComponent(nextProps, nextContext) {
    // 将新的上下文和属性存储到实例中
    this.nextProps = nextProps
    this.nextContext = nextContext

    /**
     * 如果 接收到新的属性或更新队列没有锁定时
     * 那么 则立即触发组件更新
     * 否则 进入队列 , 等待时机执行更新
     */
    nextProps || !updateQueue.isLocked()
      ? this.updateComponent()
      : updateQueue.enqueue(this)
  },

  /**
   * 更新组件
   */
  updateComponent() {
    let { instance, pendingStates, nextProps, nextContext } = this

    // 更新条件 : 
    // 1. 有新的属性
    // 2. componentDidMount有setState
    if (nextProps || this.hasPendingState()) {
      nextProps = nextProps || instance.props
      nextContext = nextContext || instance.context

      // 清除中间值
      this.nextProps = this.nextContext = null

      // merge the nextProps and nextState and update by one time
      shouldUpdate(
        instance,
        nextProps,
        this.getState(),
        nextContext,
        this.clearCallbacks)
    }
  },



  /**
   * 替换状态
   * @param {Object | Function} nextState 下一个状态
   */
  replaceState(nextState) {
    let { pendingStates } = this

    // pendingStates.pop()

    // push special params to point out should replace state
    wrappedReplaceState.value = nextState

    // _.addItem(pendingStates, wrappedReplaceState)
    this.enPendingQueue(wrappedReplaceState)
  },



  /**
   * 处理待处理的"状态更新" , 返回最新的组件状态
   * 
   * @returns {Object?} 返回最新的组件状态  
   * 
   * @private
   */
  getState() {
    let { instance } = this
    let { state, props } = instance

    if (this.hasPendingState()) {
      state = this.mergePendingState(state, props)
    }

    return state
  },

  /**
   * 判断是否有待处理的"状态更新"
   * @returns {Boolean}
   */
  hasPendingState() {
    return this.pendingStates.length
  },

  /**
   * "状态更新"进入待处理队列,等到适当的时机再处理"状态更新"
   * @param {Object | Function} nextState 
   */
  enPendingQueue(nextState) {
    _.addItem(this.pendingStates, nextState)
  },

  /**
   * 合并待处理的状态
   * @param {Object} componentState 
   * @param {Object} componentProps 
   * @returns {Object} 返回最终的状态
   */
  mergePendingState(componentState, componentProps) {
    let nextState = this.handlePendingStateQueue(componentState, componentProps)

    this.clearPendingStateQueue()

    return nextState
  },

  /**
   * 处理待处理状态队列
   * @param {Object} componentState 
   * @param {Object} componentProps 
   * @returns {Object} 返回最终的状态
   */
  handlePendingStateQueue(componentState, componentProps) {
    let state = _.extend({}, componentState)

    this.pendingStates.forEach(nextState => {
      let isReplace = isReplaceState(nextState)

      // 特殊处理 : 替换状态 -- 获得状态
      if (isReplace) {
        nextState = nextState.value
      }

      // 处理函数
      if (_.isFn(nextState)) {
        nextState = nextState.call(instance, state, componentProps)
      }

      // 替换 -- 用nextState替换之前的状态
      // 合并 -- 将nextState合并到state中
      state = _.extend(isReplace ? {} : state, nextState)
    })

    return state
  },

  /**
   * 清空待处理状态的队列
   */
  clearPendingStateQueue() {
    this.pendingStates.length = 0
  },



  /**
   * 判断是否被锁定
   * @returns {Boolean}
   */
  isLocked() {
    return this.isPending
  },

  /**
   * 锁定 -- 当addState时,不可以进行更新组件
   * 
   * 何时被锁定 : 
   *  1. 初始化组件时 , 避免不必要的更新
   *  2. 
   */
  lock() {
    this.isPending = true
  },

  /**
   * 解锁 -- 当addState时,可以进行更新组件
   */
  unlock() {
    this.isPending = false
  },

  /**
   * 添加回调函数
   * 
   * @param {Function?} callback 
   */
  addCallback(callback) {
    if (_.isFn(callback)) {
      _.addItem(this.pendingCallbacks, callback)
    }
  },

  /**
   * 
   * 
   */
  clearCallbacks() {
    let { pendingCallbacks, instance } = this
    if (pendingCallbacks.length > 0) {
      this.pendingCallbacks = []
      pendingCallbacks.forEach(callback => callback.call(instance))
    }
  }
}

