import * as _ from './util'
import {
  renderComponent,
  clearPending,
  compareTwoVnodes,
  getChildContext,
  syncCache
} from './virtual-dom'

/**
 * ComponentCache
 * @typedef {Object}
 * @property {Boolean} [isMounted=false] 组件是否已经mount
 * @property {Object} [parentContext] 父级的上下文
 */

/**
 * 
 */



export let updateQueue = {

  /**
   * 更新器队列
   * @type {Update[]}
   */
  updaters: [],

  /**
   * @type {Boolean}
   */
  isPending: false,

  isReady() {
    return !this.isPending
  },

  ready() {
    this.isPending = false
  },

  pending() {
    this.isPending = true
  },

  /**
   * 添加更新器
   * @param {Updater} updater 
   */
  add(updater) {
    _.addItem(this.updaters, updater)
  },

  /**
   * 
   */
  batchUpdate() {
    if (this.isPending) {
      return
    }
    this.isPending = true
		/*
		 each updater.update may add new updater to updateQueue
		 clear them with a loop
		 event bubbles from bottom-level to top-level
		 reverse the updater order can merge some props and state and reduce the refresh times
		 see Updater.update method below to know why
		*/
    let { updaters } = this
    let updater
    while (updater = updaters.pop()) {
      updater.updateComponent()
    }
    this.isPending = false
  }
}



/**
 * 更新器
 * 
 * @param {any} instance 
 */
function Updater(instance) {
	/**
   * 更新器的服务实例 ( 组件 )
   * @type {Component}
   */
  this.instance = instance

  /**
   * 存储等待更新的"状态更新""
   * @type {Array[String | Function]}
   */
  this.pendingStates = []

  /**
   * 
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
   * 
   */
  this.clearCallbacks = this.clearCallbacks.bind(this)
}

Updater.prototype = {
  /**
   * 
   * 
   * @param {any} nextProps 
   * @param {any} nextContext 
   */
  emitUpdate(nextProps, nextContext) {
    this.nextProps = nextProps
    this.nextContext = nextContext
    // receive nextProps!! should update immediately
    nextProps || !updateQueue.isPending
      ? this.updateComponent()
      : updateQueue.add(this)
  },

  isLocked() {
    return !this.isPending
  },

  unlock() {
    this.isPending = false
  },

  lock() {
    this.isPending = true
  },

  /**
   * 
   * 
   */
  updateComponent() {
    let { instance, pendingStates, nextProps, nextContext } = this
    if (nextProps || pendingStates.length > 0) {
      nextProps = nextProps || instance.props
      nextContext = nextContext || instance.context
      this.nextProps = this.nextContext = null
      // merge the nextProps and nextState and update by one time
      shouldUpdate(instance, nextProps, this.getState(), nextContext, this.clearCallbacks)
    }
  },

  /**
   * 添加一个"状态更新"
   * @param {any} nextState 
   */
  addState(nextState) {
    if (nextState) {
      _.addItem(this.pendingStates, nextState)

      if (this.isLocked()) {
        this.emitUpdate()
      }
    }
  },

  /**
   * 替换状态
   * @param {any} nextState 
   */
  replaceState(nextState) {
    let { pendingStates } = this

    pendingStates.pop()

    // push special params to point out should replace state
    _.addItem(pendingStates, [nextState])
  },

  /**
   * 获得状态
   * 
   * @returns 
   */
  getState() {
    let { instance } = this
    let { state, props } = instance

    if (this.hasPendingState()) {
      state = this.handlePendingStateQueue(state, props)

      this.clearPendingStateQueue()
    }

    return state
  },

  hasPendingState() {
    return this.pendingStates.length
  },

  handlePendingStateQueue(componentState, componentProps) {
    let state = _.extend({}, componentState)

    this.pendingStates.forEach(nextState => {
      let isReplace = isReplaceState(nextState)

      // 特殊处理 : 替换状态
      if (isReplace) {
        nextState = nextState[0]
      }

      if (_.isFn(nextState)) {
        nextState = nextState.call(instance, state, componentProps)
      }

      // 特殊处理 : 替换状态
      if (isReplace) {
        state = _.extend({}, nextState)
      } else {
        _.extend(state, nextState)
      }
    })

    return state
  },

  clearPendingStateQueue() {
    this.pendingStates.length = 0
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
  },

  /**
   * 
   * 
   * @param {any} callback 
   */
  addCallback(callback) {
    if (_.isFn(callback)) {
      _.addItem(this.pendingCallbacks, callback)
    }
  }
}

function isReplaceState(nextState) {
  return _.isArr(nextState)
}

function shouldUpdate(component, nextProps, nextState, nextContext, callback) {
  let shouldComponentUpdate = true
  if (component.shouldComponentUpdate) {
    shouldComponentUpdate = component.shouldComponentUpdate(nextProps, nextState, nextContext)
  }
  if (shouldComponentUpdate === false) {
    component.props = nextProps
    component.state = nextState
    component.context = nextContext || {}
    return
  }
  let cache = component.$cache
  cache.props = nextProps
  cache.state = nextState
  cache.context = nextContext || {}
  component.forceUpdate(callback)
}



/**
 * 组件
 * 
 * @export
 * @param {Object} [props] 属性
 * @param {Object} [context] 上下文
 */
export default function Component(props, context) {

  /**
   * 更新器 -- 负责处理状态的更新
   * @type {Updater}
   */
  this.$updater = new Updater(this)

  /**
   * 组件的缓存数据
   */
  this.$cache = { isMounted: false }

  /**
   * 组件的属性
   */
  this.props = props

  /**
   * 组件的状态
   */
  this.state = {}

  /**
   * 组件的引用
   */
  this.refs = {}

  /**
   * 组件的上下文
   */
  this.context = context
}

const ReactComponentSymbol = {}

Component.prototype = {
  constructor: Component,
  isReactComponent: ReactComponentSymbol,
  // getChildContext: _.noop,
  // componentWillUpdate: _.noop,
  // componentDidUpdate: _.noop,
  // componentWillReceiveProps: _.noop,
  // componentWillMount: _.noop,
  // componentDidMount: _.noop,
  // componentWillUnmount: _.noop,
  // shouldComponentUpdate(nextProps, nextState) {
  // 	return true
  // },

  /**
   * 
   * 
   * @param {any} callback 
   * @returns 
   */
  forceUpdate(callback) {
    let { $updater, $cache, props, state, context } = this
    if (!$cache.isMounted) {
      return
    }
    // if updater is pending, add state to trigger nexttick update
    if ($updater.isPending) {
      $updater.addState(state)
      return;
    }
    let nextProps = $cache.props || props
    let nextState = $cache.state || state
    let nextContext = $cache.context || context
    let parentContext = $cache.parentContext
    let node = $cache.node
    let vnode = $cache.vnode
    $cache.props = $cache.state = $cache.context = null
    $updater.isPending = true
    if (this.componentWillUpdate) {
      this.componentWillUpdate(nextProps, nextState, nextContext)
    }
    this.state = nextState
    this.props = nextProps
    this.context = nextContext
    let newVnode = renderComponent(this)
    let newNode = compareTwoVnodes(vnode, newVnode, node, getChildContext(this, parentContext))
    if (newNode !== node) {
      newNode.cache = newNode.cache || {}
      syncCache(newNode.cache, node.cache, newNode)
    }
    $cache.vnode = newVnode
    $cache.node = newNode
    clearPending()
    if (this.componentDidUpdate) {
      this.componentDidUpdate(props, state, context)
    }
    if (callback) {
      callback.call(this)
    }
    $updater.isPending = false
    $updater.emitUpdate()
  },

  /**
   * 
   * 
   * @param {any} nextState 
   * @param {any} callback 
   */
  setState(nextState, callback) {
    let { $updater } = this
    $updater.addCallback(callback)
    $updater.addState(nextState)
  },

  /**
   * 
   * 
   * @param {any} nextState 
   * @param {any} callback 
   */
  replaceState(nextState, callback) {
    let { $updater } = this
    $updater.addCallback(callback)
    $updater.replaceState(nextState)
  },

  /**
   * 
   * 
   * @returns 
   */
  getDOMNode() {
    let node = this.$cache.node
    return node && (node.nodeName === '#comment') ? null : node
  },

  /**
   * 
   * @returns {Boolean}
   */
  isMounted() {
    return this.$cache.isMounted
  },

  /**
   * 
   */
  lockUpdater() {
    this.$updater.lock()
  },

  /**
   * 
   */
  unlockUpdater() {
    this.$updater.unlock()
  },

  tryEmitComponentWillMount() {
    if (this.componentWillMount) {
      this.componentWillMount()
      this.state = this.$updater.getState()
    }
  },

  setCache(cache) {
    _.extend(this.$cache, cache)
  },

  updateNodeInfo(vnode, node) {
    this.setCache({ vnode, node })
  },

  updateMountedState() {
    this.setCache({ isMounted: true })
  }
}


