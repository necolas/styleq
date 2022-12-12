/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const cache = new WeakMap();

export const markerProp = '$$css$localize';

/**
 * The compiler polyfills logical properties and values, generating a class
 * name for both writing directions. The style objects are annotated by
 * the compiler as needing this runtime transform. The results are memoized.
 *
 * { '$$css$localize': true, float: [ 'float-left', 'float-right' ] }
 * => { float: 'float-left' }
 */

function compileStyle(style, isRTL) {
  // Create a new compiled style for styleq
  const compiledStyle = {};
  for (const prop in style) {
    if (prop !== markerProp) {
      const value = style[prop];
      if (Array.isArray(value)) {
        compiledStyle[prop] = isRTL ? value[1] : value[0];
      } else {
        compiledStyle[prop] = value;
      }
    }
  }
  return compiledStyle;
}

export function localizeStyle(style, isRTL) {
  if (style[markerProp] != null) {
    const compiledStyleIndex = isRTL ? 1 : 0;
    // Check the cache in case we've already seen this object
    if (cache.has(style)) {
      const cachedStyles = cache.get(style);
      let compiledStyle = cachedStyles[compiledStyleIndex];
      if (compiledStyle == null) {
        // Update the missing cache entry
        compiledStyle = compileStyle(style, isRTL);
        cachedStyles[compiledStyleIndex] = compiledStyle;
        cache.set(style, cachedStyles);
      }
      return compiledStyle;
    }

    // Create a new compiled style for styleq
    const compiledStyle = compileStyle(style, isRTL);
    const cachedStyles = new Array(2);
    cachedStyles[compiledStyleIndex] = compiledStyle;
    cache.set(style, cachedStyles);
    return compiledStyle;
  }
  return style;
}
