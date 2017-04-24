import { now,round } from '../utils/utils-consts';
import getCenter from './get-center';

/**
 * @typedef {Object} CloneInputData
 * @property {Number} timeStamp 时间戳
 * @property {Array} pointers 各点的位置
 * @property {Point} center 重心坐标
 * @property {Number} deltaX
 * @property {Number} deltaY
 */


/**
 * @private
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {InputData} input
 * @returns {Object} clonedInputData
 */
export default function simpleCloneInputData(input) {
  // make a simple copy of the pointers because we will get a reference if we don't
  // we only need clientXY for the calculations
  let pointers = [];
  let i = 0;
  while (i < input.pointers.length) {
    pointers[i] = {
      clientX: round(input.pointers[i].clientX),
      clientY: round(input.pointers[i].clientY)
    };
    i++;
  }

  return {
    timeStamp: now(),
    pointers,
    center: getCenter(pointers),
    deltaX: input.deltaX,
    deltaY: input.deltaY
  };
}
