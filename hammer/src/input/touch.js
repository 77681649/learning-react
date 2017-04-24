import {
  INPUT_START,
  INPUT_MOVE,
  INPUT_END,
  INPUT_CANCEL,
  INPUT_TYPE_TOUCH
} from '../inputjs/input-consts';
import Input from '../inputjs/input-constructor';
import toArray from '../utils/to-array';
import hasParent from '../utils/has-parent';
import uniqueArray from '../utils/unique-array';

const TOUCH_INPUT_MAP = {
  touchstart: INPUT_START,
  touchmove: INPUT_MOVE,
  touchend: INPUT_END,
  touchcancel: INPUT_CANCEL
};

const TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * @private
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
export default class TouchInput extends Input {

  constructor() {
    TouchInput.prototype.evTarget = TOUCH_TARGET_EVENTS;
    TouchInput.prototype.targetIds = {};
    super(...arguments);

    this.evTarget = TOUCH_TARGET_EVENTS;

    // 存储目标元素上触点的id ( 用于在每次touch时  , 获得对应的changeTouches )
    this.targetIds = {};
  }

  handler(ev) {
    let type = TOUCH_INPUT_MAP[ev.type];
    let touches = getTouches.call(this, ev, type);

    if (!touches) {
      return;
    }

    this.callback(this.manager, type, {
      pointers: touches[0],
      changedPointers: touches[1],
      pointerType: INPUT_TYPE_TOUCH,
      srcEvent: ev
    });
  }

  hasTargetId(id) {
    return !!this.targetIds[id]
  }

  setTargetId(id) {
    this.targetIds[id] = true
  }

  removeTargetId(id) {
    delete this.targetIds[id]
  }
}

/**
 * @private
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed] 如果有发生变化的触点 , 那么返回本次事件的涉及的所有触点以及目标元素上变化了的触点
 */
function getTouches(ev, type) {
  let allTouches = toArray(ev.touches)
  let isOnlyTouch = type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1

  return isOnlyTouch
    ? getTouchesWhenSingleTouch(this, allTouches)
    : getTouchesWhenMultiTouch(this, allTouches, toArray(ev.changedTouches), type)
}

function getTouchesWhenSingleTouch(input, allTouches) {
  let { targetIds } = input;

  input.setTargetId(allTouches[0].identifier)

  return [allTouches, allTouches];
}

function getTouchesWhenMultiTouch(input, allTouches, changedTouches, type) {
  let { targetIds, target } = input;
  let targetTouches = getTouchesInTarget(allTouches, target)
  let changedTargetTouches;

  if (type === INPUT_START) {
    collectTargetTouchIds(input, targetTouches)
  }

  changedTargetTouches = getChangedTargetTouch(input, changedTouches)

  if (type & (INPUT_END | INPUT_CANCEL)) {
    clearupRemovedTouches(input, type, changedTouches)
  }

  if (changedTargetTouches.length > 0) {
    return [
      // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
      uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
      changedTargetTouches
    ];
  }
}

function getTouchesInTarget(touches, target) {
  return touches.filter(touch => hasParent(touch.target, target))
}

function collectTargetTouchIds(input, touches) {
  let identifier

  for (let i = 0, len = touches.length; i < len; i++) {
    identifier = touches[i].identifier

    input.setTargetId(identifier)
  }
}

function getChangedTargetTouch(input, changedTouches) {
  let changedTargetTouches = [];

  for (let i = 0, len = changedTouches.length; i < len; i++) {
    let identifier = changedTouches[i].identifier

    if (input.hasTargetId(identifier)) {
      changedTargetTouches.push(changedTouches[i]);
    }
  }

  return changedTargetTouches;
}

function clearupRemovedTouches(input, type, changedTouches) {
  for (let i = 0, len = changedTouches.length; i < len; i++) {
    let identifier = changedTouches[i].identifier
    input.removeTargetId(identifier)
  }
}