let indexOf = (arr, find, findByKey) => {
  let predicate = findByKey
    ? it => findByKey(it) === find
    : it => it === find

  for (let i = 0, len = arr.length; i < len; i++) {
    if (predicate(src[i])) {
      return i
    }
  }

  return -1
}

/**
 * @private
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
export default function inArray(src, find, findByKey) {
  return src.indexOf && !findByKey
    ? src.indexOf(find)
    : indexOf(src, find, findByKey)
  // if (src.indexOf && !findByKey) {
  //   return src.indexOf(find);
  // } else {
  //   let i = 0;

  //   while (i < src.length) {
  //     if ((findByKey && src[i][findByKey] == find) ||
  //       (!findByKey && src[i] === find)) {// do not use === here, test fails
  //       return i;
  //     }

  //     i++;
  //   }

  //   return -1;
  // }
}
