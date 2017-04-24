import inArray from './in-array';

let distinct = (arr, key) => {
  let results = [], values = [];

  for (let i = 0, len = arr.length; i < len; i++) {
    let item = arr[i]
    let val = key ? item[key] : item;

    if (inArray(values, val) < 0) {
      results.push(item);
    }

    values[i] = val;
  }

  return results;
}

let sort = (arr, key) => {
  let predicate = key
    ? (a, b) => a[key] > b[key]
    : undefined

  return arr.sort(predicate)
}

/**
 * @private
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [shouldSort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
export default function uniqueArray(src, key, shouldSort) {
  let results = distinct(src, key)

  if (shouldSort) {
    results = sort(results, key)
  }

  return results;
}
