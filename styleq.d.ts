/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare type CompiledStyle<T> = {
  [key: string]: T | string | null;
} & {
  $$css: true;
};

declare type InlineStyle = {
  [key: string]: number | string | null;
} & {
  $$css?: never;
};

declare type EitherStyle<T> = CompiledStyle<T> | InlineStyle;

declare type StylesArray<T> = T | ReadonlyArray<StylesArray<T>>;
declare type Styles<T> = StylesArray<EitherStyle<T> | false | void | undefined>;

declare type StyleqOptions<T = empty> = {
  disableCache?: boolean;
  disableMix?: boolean;
  transform?: (styleObj: EitherStyle<T>) => EitherStyle<never>;
};

declare type StyleqResult = [string, InlineStyle | null];
declare type Styleq<T> = (styles: Styles<T>) => StyleqResult;

declare type IStyleq = {
  <T = empty>(...styles: Array<Styles<T>>): StyleqResult;
  factory: <T = empty>(options?: StyleqOptions<T>) => Styleq<T>;
};

declare module 'styleq' {
  export const styleq: IStyleq;
}

declare var x: EitherStyle;
