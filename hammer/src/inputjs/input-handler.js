import { INPUT_START, INPUT_END, INPUT_CANCEL } from './input-consts';
import computeInputData from './compute-input-data';

/**
 * 
 * @typedef {Object} InputData
 * @property {String} eventType 事件类型
 * @property {any} pointers 所有触点
 * @property {any} changedPointers 变换了的触点
 * @property {any} pointerType 触点类型
 * @property {Event} srcEvent 事件对象
 * @property {Boolean} isFirst 首次数据输入 ( 手势开始 )
 * @property {Boolean} isFinal 数据输入完成 ( 手势结束 )
 */

/**
 * @private
 * handle input events
 * @param {Manager} manager 识别器的管理器实例
 * @param {String} eventType 事件类型
 * @param {InputData} input 输入数据
 */
export default function inputHandler(manager, eventType, input) {
  let pointersLen = input.pointers.length;
  let changedPointersLen = input.changedPointers.length;

  input.isFirst = isInputFirst(eventType, pointersLen, changedPointersLen)
  input.isFinal = isInputFinal(eventType, pointersLen, changedPointersLen)

  if (input.isFirst) {
    manager.initSession();
  }

  // source event is the normalized value of the domEvents
  // like 'touchstart, mouseup, pointerdown'
  input.eventType = eventType;

  // compute scale, rotation etc
  computeInputData(manager, input);

  // emit secret event
  manager.emit('hammer.input', input);

  manager.recognize(input);

  manager.savePrevInput(input);
}

function isInputFirst(eventType, allPointersLen, changedPointersLen) {
  // 触发开始 && 所有触点 === 新增触点 
  return !!(eventType & INPUT_START && (allPointersLen === changedPointersLen))
}

function isInputFinal(eventType, allPointersLen, changedPointersLen) {
  // 触发结束或触发取消 && 所有触点 === 删除触点
  return !!(eventType & (INPUT_END | INPUT_CANCEL) && (allPointersLen === changedPointersLen))
}