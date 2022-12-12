/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

export type CompiledStyle<+T> = {
  +$$css: true,
  +[key: string]: T | string | null,
};

export type InlineStyle = {
  $$css?: empty,
  [key: string]: number | string | null,
};

export type EitherStyle<+T> = CompiledStyle<T> | InlineStyle;

export type StylesArray<+T> = T | $ReadOnlyArray<StylesArray<T>>;
export type Styles<+T> = StylesArray<EitherStyle<T> | false | void>;

export type StyleqOptions<T = empty> = {
  disableCache?: boolean,
  disableMix?: boolean,
  transform?: (EitherStyle<T>) => EitherStyle<empty>,
};

export type StyleqResult = [string, InlineStyle | null];
export type Styleq<T> = (styles: Styles<T>) => StyleqResult;

export type IStyleq = {
  <T = empty>(...styles: $ReadOnlyArray<Styles<T>>): StyleqResult,
  factory: <T = empty>(options?: StyleqOptions<T>) => Styleq<T>,
};
