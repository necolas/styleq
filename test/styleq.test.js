/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import { styleq } from '../src/styleq';

const styleqNoCache = styleq.factory({ disableCache: true });
const styleqNoMix = styleq.factory({ disableMix: true });

describe('styleq()', () => {
  test('warns if extracted property values are not strings', () => {
    const err = console.error;
    console.error = (msg) => {
      throw new Error(msg);
    };
    const style = { $$css: true, a: 1, b: 2 };
    expect(() => styleq(style)).toThrow();
    console.error = err;
  });

  test('combines different class names', () => {
    const style = { $$css: true, a: 'aaa', b: 'bbb' };
    expect(styleqNoCache(style)[0]).toBe('aaa bbb');
    expect(styleq(style)[0]).toBe('aaa bbb');
  });

  test('combines different class names in order', () => {
    const a = { $$css: true, a: 'a', ':focus$aa': 'focus$aa' };
    const b = { $$css: true, b: 'b' };
    const c = { $$css: true, c: 'c', ':focus$cc': 'focus$cc' };
    expect(styleqNoCache([a, b, c])[0]).toBe('a focus$aa b c focus$cc');
    expect(styleq([a, b, c])[0]).toBe('a focus$aa b c focus$cc');
  });

  test('dedupes class names for the same key', () => {
    const a = { $$css: true, backgroundColor: 'backgroundColor-a' };
    const b = { $$css: true, backgroundColor: 'backgoundColor-b' };
    const c = { $$css: true, backgroundColor: 'backgoundColor-c' };
    expect(styleqNoCache([a, b])[0]).toEqual('backgoundColor-b');
    expect(styleq([a, b])[0]).toEqual('backgoundColor-b');
    // Tests memoized result of [a,b] is correct
    expect(styleq([c, a, b])[0]).toEqual('backgoundColor-b');
  });

  test('dedupes class names in complex merges', () => {
    const styles = {
      a: {
        $$css: true,
        backgroundColor: 'backgroundColor-a',
        borderColor: 'borderColor-a',
        borderStyle: 'borderStyle-a',
        borderWidth: 'borderWidth-a',
        boxSizing: 'boxSizing-a',
        display: 'display-a',
        listStyle: 'listStyle-a',
        marginTop: 'marginTop-a',
        marginEnd: 'marginEnd-a',
        marginBottom: 'marginBottom-a',
        marginStart: 'marginStart-a',
        paddingTop: 'paddingTop-a',
        paddingEnd: 'paddingEnd-a',
        paddingBottom: 'paddingBottom-a',
        paddingStart: 'paddingStart-a',
        textAlign: 'textAlign-a',
        textDecoration: 'textDecoration-a',
        whiteSpace: 'whiteSpace-a',
        wordWrap: 'wordWrap-a',
        zIndex: 'zIndex-a',
      },
      b: {
        $$css: true,
        cursor: 'cursor-b',
        touchAction: 'touchAction-b',
      },
      c: {
        $$css: true,
        outline: 'outline-c',
      },
      d: {
        $$css: true,
        cursor: 'cursor-d',
        touchAction: 'touchAction-d',
      },
      e: {
        $$css: true,
        textDecoration: 'textDecoration-e',
        ':focus$textDecoration': 'focus$textDecoration-e',
      },
      f: {
        $$css: true,
        backgroundColor: 'backgroundColor-f',
        color: 'color-f',
        cursor: 'cursor-f',
        display: 'display-f',
        marginEnd: 'marginEnd-f',
        marginStart: 'marginStart-f',
        textAlign: 'textAlign-f',
        textDecoration: 'textDecoration-f',
        ':focus$color': 'focus$color-f',
        ':focus$textDecoration': 'focus$textDecoration-f',
        ':active$transform': 'active$transform-f',
        ':active$transition': 'active$transition-f',
      },
      g: {
        $$css: true,
        display: 'display-g',
        width: 'width-g',
      },
      h: {
        $$css: true,
        ':active$transform': 'active$transform-h',
      },
    };

    // This tests that repeat results are the same, and that memoized chunks
    // are correctly recorded. The second test reuses chunks from the first.

    // ONE
    const one = [
      styles.a,
      false,
      [
        styles.b,
        false,
        styles.c,
        [styles.d, false, styles.e, false, [styles.f, styles.g], [styles.h]],
      ],
    ];
    const oneValue = styleq(one)[0];
    const oneRepeat = styleq(one)[0];
    // Check the memoized result is correct
    expect(oneValue).toEqual(oneRepeat);
    expect(oneValue).toMatchInlineSnapshot(
      `"borderColor-a borderStyle-a borderWidth-a boxSizing-a listStyle-a marginTop-a marginBottom-a paddingTop-a paddingEnd-a paddingBottom-a paddingStart-a whiteSpace-a wordWrap-a zIndex-a outline-c touchAction-d backgroundColor-f color-f cursor-f marginEnd-f marginStart-f textAlign-f textDecoration-f focus$color-f focus$textDecoration-f active$transition-f display-g width-g active$transform-h"`
    );

    // TWO
    const two = [
      styles.d,
      false,
      [
        styles.c,
        false,
        styles.b,
        [styles.a, false, styles.e, false, [styles.f, styles.g], [styles.h]],
      ],
    ];
    const twoValue = styleq(two)[0];
    const twoRepeat = styleq(two)[0];
    // Check the memoized result is correct
    expect(twoValue).toEqual(twoRepeat);
    expect(twoValue).toMatchInlineSnapshot(
      `"outline-c touchAction-b borderColor-a borderStyle-a borderWidth-a boxSizing-a listStyle-a marginTop-a marginBottom-a paddingTop-a paddingEnd-a paddingBottom-a paddingStart-a whiteSpace-a wordWrap-a zIndex-a backgroundColor-f color-f cursor-f marginEnd-f marginStart-f textAlign-f textDecoration-f focus$color-f focus$textDecoration-f active$transition-f display-g width-g active$transform-h"`
    );
  });

  test('dedupes inline styles', () => {
    const [, inlineStyle] = styleq([{ a: 'a' }, { a: 'aa' }]);
    expect(inlineStyle).toEqual({ a: 'aa' });
    const [, inlineStyle2] = styleq([{ a: 'a' }, { a: null }]);
    expect(inlineStyle2).toEqual(null);
  });

  test('dedupes class names and inline styles', () => {
    const a = { $$css: true, a: 'a', ':focus$a': 'focus$a' };
    const b = { $$css: true, b: 'b' };
    const binline = { b: 'b', bb: null };
    const binlinealt = { b: null };

    const [className1, inlineStyle1] = styleq([a, b, binline]);
    expect(className1).toBe('a focus$a');
    expect(inlineStyle1).toEqual({ b: 'b' });

    const [className2, inlineStyle2] = styleq([a, binline, b]);
    expect(className2).toBe('a focus$a b');
    expect(inlineStyle2).toEqual(null);

    const [className3, inlineStyle3] = styleq([a, b, binlinealt]);
    expect(className3).toBe('a focus$a');
    expect(inlineStyle3).toEqual(null);
  });

  test('disableMix dedupes inline styles', () => {
    const [, inlineStyle] = styleqNoMix([{ a: 'a' }, { a: 'aa' }]);
    expect(inlineStyle).toEqual({ a: 'aa' });
    const [, inlineStyle2] = styleqNoMix([{ a: 'a' }, { a: null }]);
    expect(inlineStyle2).toEqual({ a: null });
  });

  test('disableMix does not dedupe class names and inline styles', () => {
    const a = { $$css: true, a: 'a', ':focus$a': 'focus$a' };
    const b = { $$css: true, b: 'b' };
    const binline = { b: 'b', bb: null };

    // Both should produce: [ 'a hover$a b', { b: 'b' } ]
    expect(styleqNoMix([a, b, binline])).toEqual(styleqNoMix([a, binline, b]));
  });
});
