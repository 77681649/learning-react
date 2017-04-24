import { INPUT_START, INPUT_END } from './input-consts';

/**
 * 计算移动增量
 * @param {ManagerSession} session 
 * @param {InputData} input 
 * @returns {Point} 返回动作的相对于起始点的移动增量
 */
export default function computeDeltaXY(session, input) {
  let { center } = input;
  // let { offsetDelta:offset = {}, prevDelta = {}, prevInput = {} } = session;
  // jscs throwing error on defalut destructured values and without defaults tests fail
  let offset = session.offsetDelta || {};
  let prevDelta = session.prevDelta || {};
  let prevInput = session.prevInput || {};

  // 新增或移除触点都需要重置原点和起始点
  if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
    prevDelta = session.prevDelta = {
      x: prevInput.deltaX || 0,
      y: prevInput.deltaY || 0
    };

    offset = session.offsetDelta = {
      x: center.x,
      y: center.y
    };
  }

  /**
   * prevDelta 坐标原点
   * offset 起始点
   * center 目标点
   * 
   * 移动位置 = center - offset + prevDelta ( 修复多动作的情况下 , 坐标原点非(0,0)的情况 )
   */
  input.deltaX = prevDelta.x + (center.x - offset.x);
  input.deltaY = prevDelta.y + (center.y - offset.y);
}
