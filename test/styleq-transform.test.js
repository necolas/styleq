/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import { styleq } from '../src/styleq';

/**
 * This compiler example polyfills logical properties and values, generating a
 * class name for both writing directions. The style objects are annotated by
 * the compiler as needing this runtime transform. The results are memoized.
 *
 * { '$$css$localize': true, float: [ 'float-left', 'float-right' ] }
 * => { float: 'float-left' }
 */

const cache = new WeakMap();

const markerProp = '$$css$localize';

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

function localizeStyle(style, isRTL) {
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

describe('transform: styles', () => {
  let isRTL = false;
  const styleqWithLocalization = styleq.factory({
    transform(style) {
      return localizeStyle(style, isRTL);
    }
  });

  const fixture = {
    $$css: true,
    $$css$localize: true,
    marginStart: ['margin-left-0px', 'margin-right-0px'],
    marginEnd: ['margin-right-10px', 'margin-left-10px']
  };

  test('supports style transforms', () => {
    isRTL = false;
    const [classNameLtr, styleLtr] = styleqWithLocalization(fixture, {
      opacity: 1
    });
    expect(classNameLtr).toEqual('margin-left-0px margin-right-10px');
    expect(styleLtr).toEqual({ opacity: 1 });

    isRTL = true;
    const [classNameRtl, styleRtl] = styleqWithLocalization(fixture, {
      opacity: 1
    });
    expect(classNameRtl).toEqual('margin-right-0px margin-left-10px');
    expect(styleRtl).toEqual({ opacity: 1 });
  });

  test('memoizes results', () => {
    const firstStyle = localizeStyle(fixture, false);
    const secondStyle = localizeStyle(fixture, false);
    expect(firstStyle).toBe(secondStyle);
  });
});
