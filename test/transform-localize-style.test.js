/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import { styleq } from '../src/styleq';
import { localizeStyle } from '../src/transform-localize-style';

describe('transform: logical styles', () => {
  let isRTL = false;
  const styleqWithLocalization = styleq.factory({
    transform(style) {
      return localizeStyle(style, isRTL);
    },
  });

  const fixture = {
    $$css: true,
    $$css$localize: true,
    marginStart: ['margin-left-0px', 'margin-right-0px'],
    marginEnd: ['margin-right-10px', 'margin-left-10px'],
  };

  test('transforms styles for LTR', () => {
    isRTL = false;
    const [ltr, style] = styleqWithLocalization(fixture, { opacity: 1 });
    expect(ltr).toEqual('margin-left-0px margin-right-10px');
    expect(style).toEqual({ opacity: 1 });
  });

  test('transforms styles for RTL', () => {
    isRTL = true;
    const [rtl, style] = styleqWithLocalization(fixture, { opacity: 1 });
    expect(rtl).toEqual('margin-right-0px margin-left-10px');
    expect(style).toEqual({ opacity: 1 });
  });

  test('memoizes results', () => {
    const firstStyle = localizeStyle(fixture, false);
    const secondStyle = localizeStyle(fixture, false);
    expect(firstStyle).toBe(secondStyle);
  });
});
