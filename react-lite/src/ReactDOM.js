import * as _ from './util'
import {
  COMPONENT_ID,
  VELEMENT,
  VCOMPONENT,
  ELEMENT_NODE_TYPE,
  DOC_NODE_TYPE,
  DOCUMENT_FRAGMENT_NODE_TYPE
} from './constant'
import { initVnode, destroyVnode, clearPending, compareTwoVnodes } from './virtual-dom'
import { updateQueue } from './componentUpdateQueue'

function isValidContainer(node) {
  return !!(node && (
    node.nodeType === ELEMENT_NODE_TYPE ||
    node.nodeType === DOC_NODE_TYPE ||
    node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE
  ))
}

/**
 * 
 */
let pendingRendering = {}

/**
 * 存储已渲染过的虚拟节点
 * @type {Map<VNode>}
 */
let vnodeStore = {}

/**
 * 将vnode渲染到指定的容器元素中
 * 
 * @param {VNode} vnode 虚拟节点
 * @param {HtmlElement} container 容器元素
 * @param {Function} [callback] 回调函数
 * @param {Object} [parentContext] 父级元素的上下文
 * @returns {VNode}
 */
function renderTreeIntoContainer(vnode, container, callback, parentContext) {

  ensureRenderParamIsValid(vnode, container)

  let id = getContainerID(container)

  let saveContainerArgument = () => {
    let argument = { vnode, callback, parentContext }

    return isContainerLocked(id)
      ? createContainerArgument(id, argument)
      : updateContainerArgument(id, argument)
  }

  let argsCache = getContainerArgument(id)

  let rendered = !!argsCache

  // component lify cycle method maybe call root rendering
  // should bundle them and render by only one time
  if (rendered) {
    saveContainerArgument()

    return
  }

  lockContainer(id)

  // 创建DOM树 , 返回根节点
  let rootNode = renderDOMTreeToContainer(id, vnode, container, parentContext)

  let unlocked = !updateQueue.isLocked()
  
  updateQueue.lock()
  
  // 处理refs
  // 处理待更新的组件
  clearPending()
  
  argsCache = pendingRendering[id]

  unlockContainer(id)

  let result = null

  if (typeof argsCache === 'object') {
    result = renderTreeIntoContainer(
      argsCache.vnode,
      container,
      argsCache.callback,
      argsCache.parentContext)
  } else if (vnode.vtype === VELEMENT) {
    result = rootNode
  } else if (vnode.vtype === VCOMPONENT) {
    result = rootNode.cache[vnode.uid]
  }

  if (unlocked) {
    updateQueue.unlock()
    updateQueue.batchUpdate()
  }

  callCallback(callback, result)

  return result
}

function ensureRenderParamIsValid(vnode, container) {
  if (!vnode.vtype) {
    throw new Error(`cannot render ${vnode} to container`)
  }

  if (!isValidContainer(container)) {
    throw new Error(`container ${container} is not a DOM element`)
  }
}

function getContainerID(container) {
  return container[COMPONENT_ID] || (container[COMPONENT_ID] = _.getUid())
}

function isContainerLocked(id) {
  return getContainerArgument(id) === true
}

function lockContainer(id) {
  pendingRendering[id] = true
}

function unlockContainer(id) {
  delete pendingRendering[id]
}

function getContainerArgument(id) {
  return pendingRendering[id]
}

function createContainerArgument(id, argument) {
  pendingRendering[id] = argument

  return argument
}

function updateContainerArgument(id, newArgument) {
  let argument = getContainerArgument(id)
  let oldCallback = argument.callback
  let newCallback = newArgument.callback

  argument.vnode = newArgument.vnode
  argument.parentContext = newArgument.parentContext
  argument.callback = oldCallback
    ? _.pipe(oldCallback, newCallback)
    : newCallback

  pendingRendering[id] = argument

  return argument
}

function renderDOMTreeToContainer(id, vnode, container, parentContext) {
  let oldVnode = getVNodeCache(id)
  let rendered = !!oldVnode
  let rootNode = null

  rootNode = rendered
    ? compareTwoVnodes(oldVnode, vnode, container.firstChild, parentContext)
    : initVnode(vnode, parentContext, container.namespaceURI)

  if (!rendered) {
    clearAllChildNode(container)
    appendToContainer(container, rootNode)
  }

  setVNodeCache(id, vnode)

  return rootNode
}

function appendToContainer(container, node) {
  container.appendChild(node)
}

function clearAllChildNode(node) {
  var childNode = null

  while (childNode = node.lastChild) {
    node.removeChild(childNode)
  }
}

function getVNodeCache(id) {
  return vnodeStore[id]
}

function setVNodeCache(id, vnode) {
  vnodeStore[id] = vnode
}

function callCallback(callback, context) {
  if (callback) {
    callback.call(context)
  }
}

/**
 * 将vnode渲染到指定的容器元素中
 * 
 * @param {VNode} vnode 虚拟节点
 * @param {HtmlElement} container 容器元素
 * @param {Function} [callback] 回调函数
 * @returns {VNode}
 */
export function render(vnode, container, callback) {
  return renderTreeIntoContainer(vnode, container, callback)
}

export function unstable_renderSubtreeIntoContainer(parentComponent, subVnode, container, callback) {
  let context = parentComponent.$cache.parentContext
  return renderTreeIntoContainer(subVnode, container, callback, context)
}

export function unmountComponentAtNode(container) {
  if (!container.nodeName) {
    throw new Error('expect node')
  }
  let id = container[COMPONENT_ID]
  let vnode = null
  if (vnode = vnodeStore[id]) {
    destroyVnode(vnode, container.firstChild)
    container.removeChild(container.firstChild)
    delete vnodeStore[id]
    return true
  }
  return false
}

export function findDOMNode(node) {
  if (node == null) {
    return null
  }
  if (node.nodeName) {
    return node
  }
  let component = node
  // if component.node equal to false, component must be unmounted
  if (component.getDOMNode && component.$cache.isMounted) {
    return component.getDOMNode()
  }
  throw new Error('findDOMNode can not find Node')
}