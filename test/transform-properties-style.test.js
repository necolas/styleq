/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import { styleq } from '../src/styleq';

const propMap = {
  marginInlineStart: ['marginInlineStart', 'marginLeft', 'marginRight'],
  marginInlineEnd: ['marginInlineEnd', 'marginRight', 'marginLeft'],
  paddingInlineStart: ['paddingInlineStart', 'paddingLeft', 'paddingRight'],
  paddingInlineEnd: ['paddingInlineEnd', 'paddingRight', 'paddingLeft'],
  marginLeft: ['marginLeft', 'marginInlineStart', 'marginInlineEnd'],
  marginRight: ['marginRight', 'marginInlineEnd', 'marginInlineStart'],
  paddingLeft: ['paddingLeft', 'paddingInlineStart', 'paddingInlineEnd'],
  paddingRight: ['paddingRight', 'paddingInlineEnd', 'paddingInlineStart'],
};

const transformProperty = (property) => propMap[property] || property;

const styleqWithPropExpansion = styleq.factory({ transformProperty });

const fixtureLogical = {
  $$css: true,
  marginInlineStart: 'margin-start-0px',
  marginInlineEnd: 'margin-end-10px',
};

const fixturePhysical = {
  $$css: true,
  marginLeft: 'margin-left-4px',
  marginRight: 'margin-right-8px',
};

describe('transform: prop overrides', () => {
  test('physical overrides logical', () => {
    const [className, style] = styleqWithPropExpansion(fixtureLogical, {
      $$css: true,
      marginLeft: 'margin-left-4px',
    });
    expect(className).toEqual('margin-left-4px');
    expect(style).toEqual(null);
  });

  test('logical overrides physical', () => {
    const [className, style] = styleqWithPropExpansion(fixturePhysical, {
      $$css: true,
      marginInlineStart: 'margin-start-0px',
    });
    expect(className).toEqual('margin-start-0px');
    expect(style).toEqual(null);
  });

  test('inline styles override too', () => {
    const [className, style] = styleqWithPropExpansion(fixturePhysical, {
      marginInlineStart: 4,
    });
    expect(className).toEqual('');
    expect(style).toEqual({ marginInlineStart: 4 });
  });
});
