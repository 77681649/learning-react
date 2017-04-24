import { PROPS_XY } from './input-consts';

/**
 * 计算两个点之间的距离
 * 
 * 两点之间的距离 = sqrt( (x1 - x2) ^ 2 + ( y1 - y2 ) ^ 2 )
 * 
 * @private
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance 返回到原点的距离
 */
export default function getDistance(p1, p2, props) {
  if (!props) {
    props = PROPS_XY;
  }
  let x = p2[props[0]] - p1[props[0]];
  let y = p2[props[1]] - p1[props[1]];

  return Math.sqrt((x * x) + (y * y));
}
