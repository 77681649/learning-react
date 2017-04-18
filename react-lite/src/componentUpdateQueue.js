/**
 * 组件更新队列
 */
export default {

  /**
   * 待更新器队列
   * @type {Update[]}
   */
  updaters: [],

  /**
   * 是否就绪
   * 
   * @type {Boolean}
   */
  isPending: false,

  isLocked() {
    return this.isPending
  },

  lock() {
    this.isPending = true
  },

  unlock() {
    this.isPending = false
  },

  /**
   * 添加待更新的更新期
   * @param {Updater} updater 
   */
  enqueue(updater) {
    _.addItem(this.updaters, updater)
  },

  /**
   * 批量更新组件 ( 处理待处理的更新器 )
   */
  batchUpdate() {
    if (this.isLocked()) {
      return
    }

    this.lock()

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

    this.unlock()
  }
}