/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

'use strict';

import type { IStyleq, Styleq, StyleqOptions } from '../styleq.flow';

const cache = new WeakMap();
const compiledKey = '$$css';

function createStyleq(options?: StyleqOptions): Styleq {
  let disableCache;
  let disableMix;
  let transform;

  if (options != null) {
    disableCache = options.disableCache === true;
    disableMix = options.disableMix === true;
    transform = options.transform;
  }

  return function styleq() {
    // Keep track of property commits to the className
    const definedProperties = [];
    // The className and inline style to build up
    let className = '';
    let inlineStyle = null;
    // The current position in the cache graph
    let nextCache = disableCache ? null : cache;

    // This way of creating an array from arguments is fastest
    const styles = new Array(arguments.length);
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

      if (style[compiledKey]) {
        // Build up the class names defined by this object
        let classNameChunk = '';

        // Check the cache to see if we've already done this work
        if (nextCache != null && nextCache.has(style)) {
          // Cache: read
          const cacheEntry = nextCache.get(style);
          if (cacheEntry != null) {
            classNameChunk = cacheEntry[0];
            // $FlowIgnore
            definedProperties.push.apply(definedProperties, cacheEntry[1]);
            nextCache = cacheEntry[2];
          }
        }
        // Update the chunks with data from this object
        else {
          // The properties defined by this object
          const definedPropertiesChunk = [];
          for (const prop in style) {
            const value = style[prop];
            if (prop === compiledKey) continue;
            // Each property value is used as an HTML class name
            // { 'debug.string': 'debug.string', opacity: 's-jskmnoqp' }
            if (typeof value === 'string') {
              // Only add to chunks if this property hasn't already been seen
              if (!definedProperties.includes(prop)) {
                classNameChunk += classNameChunk ? ' ' + value : value;
                definedProperties.push(prop);
                if (nextCache != null) {
                  definedPropertiesChunk.push(prop);
                }
              }
            }
            // If we encounter a value that isn't a string
            else {
              console.error(`styleq: ${prop} typeof ${value} is not "string".`);
            }
          }
          // Cache: write
          if (nextCache != null) {
            // Create the next WeakMap for this sequence of styles
            const weakMap = new WeakMap();
            nextCache.set(style, [
              classNameChunk,
              definedPropertiesChunk,
              weakMap,
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
        for (const prop in style) {
          const value = style[prop];
          if (value !== undefined) {
            if (disableMix) {
              if (inlineStyle == null) {
                inlineStyle = {};
              }
              // Only set the value if it hasn't already been set
              if (inlineStyle[prop] === undefined) {
                inlineStyle[prop] = value;
              }
            } else if (!definedProperties.includes(prop)) {
              if (value != null) {
                if (inlineStyle == null) {
                  inlineStyle = {};
                }
                inlineStyle[prop] = value;
              }
              definedProperties.push(prop);
              // Cache is unnecessary overhead if results can't be reused.
              nextCache = null;
            }
          }
        }
      }
    }

    const styleProps = [className, inlineStyle];
    return styleProps;
  };
}

const styleq: IStyleq = createStyleq();
styleq.factory = createStyleq;

export { styleq };
