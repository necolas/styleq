/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

'use strict';

import type {
  IStyleq,
  Styleq,
  StyleqOptions,
  CompiledStyle,
  InlineStyle,
  Styles
} from '../styleq.js.flow';

type Cache = WeakMap<
  CompiledStyle,
  [
    // className
    string,
    // style
    $ReadOnlyArray<string>,
    // debug string
    string,
    Cache
  ]
>;

const cache: Cache = new WeakMap();
const compiledKey: '$$css' = '$$css';

function createStyleq(options?: StyleqOptions): Styleq {
  let disableCache;
  let disableMix;
  let transform;
  let transformProperty;

  if (options != null) {
    disableCache = options.disableCache === true;
    disableMix = options.disableMix === true;
    transform = options.transform;
    transformProperty = options.transformProperty;
  }

  return function styleq() {
    // Keep track of property commits to the className
    const definedProperties: Array<string> = [];
    // The className and inline style to build up
    let className = '';
    let inlineStyle: null | InlineStyle = null;
    // The debug string to build up
    let debugString = '';
    // The current position in the cache graph
    let nextCache = disableCache ? null : cache;

    // This way of creating an array from arguments is fastest
    const styles: Array<Styles> = new Array(arguments.length);
    for (let i = 0; i < arguments.length; i++) {
      styles[i] = arguments[i];
    }

    // Iterate over styles from last to first
    while (styles.length > 0) {
      const possibleStyle = styles.pop();
      // Skip empty items
      if (possibleStyle == null || possibleStyle === false) {
        continue;
      }
      // Push nested styles back onto the stack to be processed
      if (Array.isArray(possibleStyle)) {
        for (let i = 0; i < possibleStyle.length; i++) {
          styles.push(possibleStyle[i]);
        }
        continue;
      }

      // Process an individual style object
      const style =
        transform != null ? transform(possibleStyle) : possibleStyle;

      if (style.$$css != null) {
        // Build up the class names defined by this object
        let classNameChunk = '';

        // Check the cache to see if we've already done this work
        if (nextCache != null && nextCache.has(style)) {
          // Cache: read
          const cacheEntry = nextCache.get(style);
          if (cacheEntry != null) {
            classNameChunk = cacheEntry[0];
            debugString = cacheEntry[2];
            // $FlowIgnore
            definedProperties.push.apply(definedProperties, cacheEntry[1]);
            nextCache = cacheEntry[3];
          }
        }
        // Update the chunks with data from this object
        else {
          // The properties defined by this object
          const definedPropertiesChunk = [];
          for (const prop in style) {
            const value = style[prop];
            if (prop === compiledKey) {
              // Updating the debug string only happens once for each style in
              // the stack.
              const compiledKeyValue = style[prop];
              if (compiledKeyValue !== true) {
                debugString = debugString
                  ? compiledKeyValue + '; ' + debugString
                  : compiledKeyValue;
              }
              continue;
            }
            // Each property value is used as an HTML class name
            // { 'debug.string': 'debug.string', opacity: 's-jskmnoqp' }
            if (typeof value === 'string' || value === null) {
              // Only add to chunks if this property hasn't already been seen
              if (!definedProperties.includes(prop)) {
                if (transformProperty) {
                  const propsToDefine = transformProperty(prop);
                  if (Array.isArray(propsToDefine)) {
                    definedProperties.push(...propsToDefine);
                    if (nextCache != null) {
                      definedPropertiesChunk.push(...propsToDefine);
                    }
                  } else {
                    definedProperties.push(propsToDefine);
                    if (nextCache != null) {
                      definedPropertiesChunk.push(propsToDefine);
                    }
                  }
                } else {
                  definedProperties.push(prop);
                  if (nextCache != null) {
                    definedPropertiesChunk.push(prop);
                  }
                }
                if (typeof value === 'string') {
                  classNameChunk += classNameChunk ? ' ' + value : value;
                }
              }
            }
            // If we encounter a value that isn't a string or `null`
            else {
              console.error(
                `styleq: ${prop} typeof ${String(
                  value
                )} is not "string" or "null".`
              );
            }
          }
          // Cache: write
          if (nextCache != null) {
            // Create the next WeakMap for this sequence of styles
            const weakMap: Cache = new WeakMap();
            nextCache.set(style, [
              classNameChunk,
              definedPropertiesChunk,
              debugString,
              weakMap
            ]);
            nextCache = weakMap;
          }
        }

        // Order of classes in chunks matches property-iteration order of style
        // object. Order of chunks matches passed order of styles from first to
        // last (which we iterate over in reverse).
        if (classNameChunk) {
          className = className
            ? classNameChunk + ' ' + className
            : classNameChunk;
        }
      }

      // ----- DYNAMIC: Process inline style object -----
      else {
        if (disableMix) {
          if (inlineStyle == null) {
            inlineStyle = {};
          }
          inlineStyle = Object.assign(
            {} as { ...InlineStyle },
            style,
            inlineStyle
          );
        } else {
          let subStyle: null | { ...InlineStyle } = null;
          for (const prop in style) {
            const value = style[prop];
            if (value !== undefined) {
              if (!definedProperties.includes(prop)) {
                if (value != null) {
                  if (inlineStyle == null) {
                    inlineStyle = {};
                  }
                  if (subStyle == null) {
                    subStyle = {};
                  }
                  (subStyle as { ...InlineStyle })[prop] = value;
                }
                if (transformProperty) {
                  const propsToDefine = transformProperty(prop);
                  if (Array.isArray(propsToDefine)) {
                    definedProperties.push(...propsToDefine);
                  } else {
                    definedProperties.push(propsToDefine);
                  }
                } else {
                  definedProperties.push(prop);
                }
                // Cache is unnecessary overhead if results can't be reused.
                nextCache = null;
              }
            }
          }
          if (subStyle != null) {
            inlineStyle = Object.assign(subStyle, inlineStyle);
          }
        }
      }
    }

    const styleProps = [className, inlineStyle, debugString];
    return styleProps;
  };
}

const styleq: IStyleq = createStyleq() as $FlowFixMe;
styleq.factory = createStyleq;

export { styleq };
