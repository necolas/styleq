/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare type CompiledStyle = {
  [key: string]: string | null;
} & {
  $$css: true;
};

declare type InlineStyle = {
  [key: string]: number | string | null;
} & {
  $$css?: never;
};

declare type EitherStyle = CompiledStyle | InlineStyle;

declare type StylesArray<T> = T | ReadonlyArray<StylesArray<T>>;
declare type Styles = StylesArray<EitherStyle | false | void | undefined>;
declare type Style<T = EitherStyle> = StylesArray<false | T | null | undefined>;

declare type StyleqOptions = {
  disableCache?: boolean;
  disableMix?: boolean;
  transform?: (styleObj: EitherStyle) => EitherStyle;
};

declare type StyleqResult = [string, InlineStyle | null];
declare type Styleq = (styles: Styles) => StyleqResult;

declare type IStyleq = {
  (...styles: Array<Styles>): StyleqResult;
  factory: (options?: StyleqOptions) => Styleq;
};

declare module 'styleq' {
  export const styleq: IStyleq;
}

declare var x: EitherStyle;
