import { round } from '../utils/utils-consts';

/**
 * 获得所有点的中心点坐标
 * 
 * 重心公式 : 
 * x = (x1 + x2 + x3 + ... ) / count
 * y = (y1 + y2 + y3 + ... ) / count
 * 
 * @private
 * get the center of all the pointers
 * @param {Pointer[]} pointers
 * @return {Point} center contains `x` and `y` properties
 */
export default function getCenter(pointers) {
  let pointersLength = pointers.length;
  let onlyPointer = pointersLength === 1

  return onlyPointer
    ? getCenterForSinglePotiner(pointers)
    : getCenterForMultiplePotiner(pointers, pointersLength)
}

function getCenterForSinglePotiner(pointers) {
  let pointer = pointers[0]

  return {
    x: round(pointer.clientX),
    y: round(pointer.clientY)
  }
}

function getCenterForMultiplePotiner(pointers, pointersLength) {
  let x = 0;
  let y = 0;

  for (let i = 0; i < pointersLength; i++) {
    x += pointers[i].clientX;
    y += pointers[i].clientY;
  }

  return {
    x: round(x / pointersLength),
    y: round(y / pointersLength)
  };
}