import { PROPS_XY } from './input-consts';

/**
 * 计算两个点的之间的方位角 ( 两个点之间的中位点 )
 * 
 * 
 * Math.atan2( y , x ) 返回原点至点(x,y)的方位角 ( 单位 : 弧度 )
 * 
 * 方位角角度 = atan2( (y2 - y1) , (x2 - x1) ) * 180 / PI
 * 
 * @private
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle 返回两个坐标之间的角度
 */
export default function getAngle(p1, p2, props) {
  if (!props) {
    props = PROPS_XY;
  }
  
  let x = p2[props[0]] - p1[props[0]];
  let y = p2[props[1]] - p1[props[1]];

  return Math.atan2(y, x) * 180 / Math.PI;
}
