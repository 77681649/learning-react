import { round } from '../utils/utils-consts';

/**
 * 获得所有点的中心点坐标
 * @private
 * get the center of all the pointers
 * @param {Pointer[]} pointers
 * @return {Point} center contains `x` and `y` properties
 */
export default function getCenter(pointers) {
  let pointersLength = pointers.length;
  let onlyPointer = pointersLength === 1

  return onlyPointer
    ? getCenterForSingle(pointers)
    : getCenterForMulti(pointers, pointersLength)
}

function getCenterForSingle(pointers) {
  let pointer = pointers[0]

  return {
    x: round(pointer.clientX),
    y: round(pointer.clientY)
  }
}

function getCenterForMulti(pointers, pointersLength) {
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