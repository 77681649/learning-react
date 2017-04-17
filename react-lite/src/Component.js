import * as _ from './util'
import {
  renderComponent,
  clearPending,
  compareTwoVnodes,
  getChildContext,
  syncCache
} from './virtual-dom'
import * as Updater from './ComponentStateUpdater'


/**
 * ComponentCache
 * @typedef {Object}
 * @property {Boolean} [isMounted=false] 组件是否已经mount
 * @property {Object} [parentContext] 父级的上下文
 */

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
   * 强制更新
   * 
   * @param {Function} callback 
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

    $updater.unlock()
    $updater.tryUpdateComponent()
  },

  /**
   * 设置状态
   * 
   * @param {Function | Object} nextState 下一个状态
   * @param {Function} [callback] 
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
   * 锁定更新器
   */
  lockUpdater() {
    this.$updater.lock()
  },

  /**
   * 解锁更新器
   */
  unlockUpdater() {
    this.$updater.unlock()
  },

  tryEmitComponentWillMount() {
    if (this.componentWillMount) {
      this.componentWillMount()

      // 获得最新的状态 ( 将还未处理的状态处理掉 , 获得最新的状态 )
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


