/**
 * CSS 属性操作函数
 * CSS Property Operations
 */

/**
 * 用styles中的样式属性项 , 设置元素的样式属性
 * @param {Object} elemStyle 元素的样式
 * @param {Object} styles 设置的样式属性
 */
export function setStyle(elemStyle, styles) {
    for (let styleName in styles) {
        if (styles.hasOwnProperty(styleName)) {
            setStyleValue(elemStyle, styleName, styles[styleName])
        }
    }
}

/**
 * 将styles中指定的样式属性项从元素的样式属性中移除
 * @param {Object} elemStyle 元素的样式
 * @param {Object} styles 待移除的样式属性
 */
export function removeStyle(elemStyle, styles) {
    for (let styleName in styles) {
        if (styles.hasOwnProperty(styleName)) {
            elemStyle[styleName] = ''
        }
    }
}

/**
 * 根据旧的和新的样式属性 , 合并出最新的元素样式属性
 * @param {Object} elemStyle 元素的样式
 * @param {Object} style 旧的属性
 * @param {Object} newStyle 新的属性
 */
export function patchStyle(elemStyle, style, newStyle) {
    // 若相等 , 则不做任何处理
    if (style === newStyle) {
        return
    }


    if (!newStyle && style) {
        // 若有旧的 , 但是没有新的 , 则从元素的样式中删除旧的样式属性
        removeStyle(elemStyle, style)
        return
    } else if (newStyle && !style) {
        // 若有新的 , 但没有就旧的 , 则将新的属性添加到元素样式属性中
        setStyle(elemStyle, newStyle)
        return
    }
    else {
        // 遍历旧的样式属性 , 更新已有的旧属性值
        for (let key in style) {
            if (newStyle.hasOwnProperty(key)) {
                // 若旧属性项在新属性中存在 && 发生变化 , 则更新
                if (newStyle[key] !== style[key]) {
                    setStyleValue(elemStyle, key, newStyle[key])
                }
            } else {
                // 若旧属性项在新属性中存在不存在 , 则删除
                elemStyle[key] = ''
            }
        }

        // 遍历新属性 , 将新增的属性项添加到样式属性中
        for (let key in newStyle) {
            if (!style.hasOwnProperty(key)) {
                setStyleValue(elemStyle, key, newStyle[key])
            }
        }
    }
}

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
const isUnitlessNumber = {
    animationIterationCount: 1,
    borderImageOutset: 1,
    borderImageSlice: 1,
    borderImageWidth: 1,
    boxFlex: 1,
    boxFlexGroup: 1,
    boxOrdinalGroup: 1,
    columnCount: 1,
    flex: 1,
    flexGrow: 1,
    flexPositive: 1,
    flexShrink: 1,
    flexNegative: 1,
    flexOrder: 1,
    gridRow: 1,
    gridColumn: 1,
    fontWeight: 1,
    lineClamp: 1,
    lineHeight: 1,
    opacity: 1,
    order: 1,
    orphans: 1,
    tabSize: 1,
    widows: 1,
    zIndex: 1,
    zoom: 1,

    // SVG-related properties
    fillOpacity: 1,
    floodOpacity: 1,
    stopOpacity: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    strokeMiterlimit: 1,
    strokeOpacity: 1,
    strokeWidth: 1,
}

/**
 * 为key添加前缀
 * 
 * @example
 * prefixKey('Webkit','flex) ==> WebkitFlex
 * 
 * @param {String} prefix 前缀
 * @param {String} key key
 * @returns {String} 返回添加了前缀的key
 */
function prefixKey(prefix, key) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1)
}

let prefixes = ['Webkit', 'ms', 'Moz', 'O']

// 给非数字值的属性 , 加上前缀
Object.keys(isUnitlessNumber).forEach(function (prop) {
    prefixes.forEach(function (prefix) {
        isUnitlessNumber[prefixKey(prefix, prop)] = 1
    })
})

/**
 * 匹配数字的正则表达式
 * 
 * -10
 * -10.12
 * -0.12
 */
let RE_NUMBER = /^-?\d+(\.\d+)?$/

/**
 * 设置样式属性的值
 * @param {Object} elemStyle 样式属性
 * @param {String} styleName 样式属性的名称
 * @param {String} styleValue 样式属性的值
 * 
 * @private
 */
function setStyleValue(elemStyle, styleName, styleValue) {

    // 值为数字 , 并且属性要求的值为数字
    // 那么 , 默认加上'px'
    if (!isUnitlessNumber[styleName] && RE_NUMBER.test(styleValue)) {
        elemStyle[styleName] = styleValue + 'px'
        return
    }

    // fix float属性 ( cssFloat )
    if (styleName === 'float') {
        styleName = 'cssFloat'
    }

    // 如果 值为 null , undefined , Boolean 
    // 那么 表示值应该设置为空
    if (styleValue == null || typeof styleValue === 'boolean') {
        styleValue = ''
    }

    // 设置值
    elemStyle[styleName] = styleValue
}