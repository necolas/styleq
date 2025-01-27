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
  paddingRight: ['paddingRight', 'paddingInlineEnd', 'paddingInlineStart']
};

const transformProperty = (property) => propMap[property] || property;

const styleqWithPropExpansion = styleq.factory({ transformProperty });

describe('transformProperty', () => {
  test('later overrides multiple earlier', () => {
    const [className, style] = styleqWithPropExpansion([
      {
        $$css: true,
        display: 'display-1',
        marginInlineStart: 'marginInlineStart-1',
        marginInlineEnd: 'marginInlineEnd-1'
      },
      {
        $$css: true,
        marginLeft: 'marginLeft-2'
      }
    ]);
    expect(className).toEqual('display-1 marginLeft-2');
    expect(style).toEqual(null);
  });

  test('sequence of overrides', () => {
    const [className, style] = styleqWithPropExpansion([
      {
        $$css: true,
        display: 'display-1',
        marginInlineStart: 'marginInlineStart-1',
        marginInlineEnd: 'marginInlineEnd-1'
      },
      {
        $$css: true,
        marginLeft: 'marginLeft-2'
      },
      {
        $$css: true,
        marginInlineStart: 'marginInlineStart-3'
      }
    ]);
    expect(className).toEqual(
      'display-1 marginInlineEnd-1 marginInlineStart-3'
    );
    expect(style).toEqual(null);
  });

  test('accounts for inline styles', () => {
    const [className, style] = styleqWithPropExpansion([
      {
        $$css: true,
        display: 'display-1',
        marginLeft: 'marginLeft-1',
        marginRight: 'marginRight-1'
      },
      {
        marginInlineStart: 2
      }
    ]);
    expect(className).toEqual('display-1');
    expect(style).toEqual({ marginInlineStart: 2 });
  });
});
