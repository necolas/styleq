/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const Benchmark = require('benchmark');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { styleq } = require('../dist/styleq');

/**
 * CLI
 */

// run.js --outfile filename.js
const argv = yargs(hideBin(process.argv)).option('outfile', {
  alias: 'o',
  type: 'string',
  description: 'Output file',
  demandOption: false
}).argv;
const outfile = argv.outfile;

/**
 * Test helpers
 */

function createSuite(name, options) {
  const suite = new Benchmark.Suite(name);
  const test = (...args) => suite.add(...args);

  function jsonReporter(suite) {
    const benchmarks = [];

    suite.on('cycle', (event) => {
      benchmarks.push(event.target);
    });

    suite.on('error', (event) => {
      throw new Error(String(event.target.error));
    });

    suite.on('complete', () => {
      const timestamp = Date.now();
      const result = benchmarks.map((bench) => {
        if (bench.error) {
          return {
            name: bench.name,
            id: bench.id,
            error: bench.error
          };
        }

        return {
          name: bench.name,
          id: bench.id,
          samples: bench.stats.sample.length,
          deviation: bench.stats.rme.toFixed(2),
          ops: bench.hz.toFixed(bench.hz < 100 ? 2 : 0),
          timestamp
        };
      });
      options.callback(result, suite.name);
    });
  }

  jsonReporter(suite);
  return { suite, test };
}

/**
 * Test setup
 */

const aggregatedResults = {};
const options = {
  callback(data, suiteName) {
    const testResults = data.reduce((acc, test) => {
      const { name, ops } = test;
      acc[name] = ops;
      return acc;
    }, {});

    aggregatedResults[suiteName] = testResults;
  }
};

console.log('Running performance benchmark, please wait...');

const { suite, test } = createSuite('styleq', options);

/**
 * Additional test subjects
 */
const transformCache = new WeakMap();
const transform = (style) => {
  // Check the cache in case we've already seen this object
  if (transformCache.has(style)) {
    const flexStyle = transformCache.get(style);
    return flexStyle;
  }
  // Create a new compiled style for styleq
  const flexStyle = { ...style, display: 'display-flex' };
  transformCache.set(style, flexStyle);
  return flexStyle;
};

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

const styleqNoCache = styleq.factory({ disableCache: true });
const styleqNoMix = styleq.factory({ disableMix: true });
const styleqTransform = styleq.factory({ transform });
const styleqTransformProperty = styleq.factory({ transformProperty });
const styleqTransformPropertyNoCache = styleq.factory({
  disableCache: true,
  transformProperty
});

/**
 * Fixtures
 */

const basicStyleFixture1 = {
  $$css: true,
  backgroundColor: 'backgroundColor-1',
  color: 'color-1'
};

const basicStyleFixture2 = {
  $$css: true,
  backgroundColor: 'backgroundColor-2',
  color: 'color-2'
};

const bigStyleFixture = {
  $$css: true,
  backgroundColor: 'backgroundColor-3',
  borderColor: 'borderColor-3',
  borderStyle: 'borderStyle-3',
  borderWidth: 'borderWidth-3',
  boxSizing: 'boxSizing-3',
  display: 'display-3',
  listStyle: 'listStyle-3',
  marginBottom: 'marginBottom-3',
  marginInlineEnd: 'marginInlineEnd-3',
  marginInlineStart: 'marginInlineStart-3',
  marginLeft: 'marginLeft-3',
  marginRight: 'marginRight-3',
  marginTop: 'marginTop-3',
  paddingBottom: 'paddingBottom-3',
  paddingInlineEnd: 'paddingInlineEnd-3',
  paddingInlineStart: 'paddingInlineStart-3',
  paddingLeft: 'paddingLeft-3',
  paddingRight: 'paddingRight-3',
  paddingTop: 'paddingTop-3',
  textAlign: 'textAlign-3',
  textDecoration: 'textDecoration-3',
  whiteSpace: 'whiteSpace-3',
  wordWrap: 'wordWrap-3',
  zIndex: 'zIndex-3'
};

const bigStyleWithPseudosFixture = {
  $$css: true,
  backgroundColor: 'backgroundColor-4',
  border: 'border-4',
  color: 'color-4',
  cursor: 'cursor-4',
  display: 'display-4',
  fontFamily: 'fontFamily-4',
  fontSize: 'fontSize-4',
  lineHeight: 'lineHeight-4',
  marginEnd: 'marginEnd-4',
  marginStart: 'marginStart-4',
  paddingEnd: 'paddingEnd-4',
  paddingStart: 'paddingStart-4',
  textAlign: 'textAlign-4',
  textDecoration: 'textDecoration-4',
  ':focus$color': 'focus$color-4',
  ':focus$textDecoration': 'focus$textDecoration-4',
  ':active$transform': 'active$transform-4',
  ':active$transition': 'active$transition-4'
};

const complexNestedStyleFixture = [
  bigStyleFixture,
  false,
  false,
  false,
  false,
  [
    {
      $$css: true,
      cursor: 'cursor-a',
      touchAction: 'touchAction-a'
    },
    false,
    {
      $$css: true,
      outline: 'outline-b'
    },
    [
      {
        $$css: true,
        cursor: 'cursor-c',
        touchAction: 'touchAction-c'
      },
      false,
      false,
      {
        $$css: true,
        textDecoration: 'textDecoration-d',
        ':focus$textDecoration': 'focus$textDecoration-d'
      },
      false,
      [
        bigStyleWithPseudosFixture,
        {
          $$css: true,
          display: 'display-e',
          width: 'width-e'
        },
        [
          {
            $$css: true,
            ':active$transform': 'active$transform-f'
          }
        ]
      ]
    ]
  ]
];

/**
 * Performance tests
 */

// SMALL OBJECT

test('small object', () => {
  styleq(basicStyleFixture1);
});

test('small object (cache miss)', () => {
  styleq({ ...basicStyleFixture1 });
});

test('small object (cache disabled)', () => {
  styleqNoCache({ ...basicStyleFixture1 });
});

// LARGE OBJECT

test('large object', () => {
  styleq(bigStyleFixture);
});

test('large object (cache miss)', () => {
  styleq({ ...bigStyleFixture });
});

test('large object (cache disabled)', () => {
  styleqNoCache({ ...bigStyleFixture });
});

// SMALL MERGE

test('small merge', () => {
  styleq(basicStyleFixture1, basicStyleFixture2);
});

test('small merge (cache miss)', () => {
  styleq({ ...basicStyleFixture1 }, { ...basicStyleFixture2 });
});

test('small merge (cache disabled)', () => {
  styleqNoCache(basicStyleFixture1, basicStyleFixture2);
});

// LARGE MERGE

test('large merge', () => {
  styleq([complexNestedStyleFixture]);
});

test('large merge (cache disabled)', () => {
  styleqNoCache([complexNestedStyleFixture]);
});

test('large merge (transform)', () => {
  styleqTransform([complexNestedStyleFixture]);
});

test('large merge (transformProperty)', () => {
  styleqTransformProperty([complexNestedStyleFixture]);
});

test('large merge (transformProperty, cache disabled)', () => {
  styleqTransformPropertyNoCache([complexNestedStyleFixture]);
});

// INLINE STYLES

test('small inline style', () => {
  styleq({ backgroundColor: 'red' });
});

test('large inline style', () => {
  styleq({
    backgroundColor: 'red',
    borderColor: 'red',
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-bx',
    display: 'flex',
    listStyle: 'none',
    marginTop: '0',
    marginEnd: '0',
    marginBottom: '0',
    marginStart: '0',
    paddingTop: '0',
    paddingEnd: '0',
    paddingBottom: '0',
    paddingStart: '0',
    textAlign: 'start',
    textDecoration: 'none',
    whiteSpace: 'pre',
    zIndex: '0'
  });
});

test('merged inline style', () => {
  styleq(
    {
      backgroundColor: 'blue',
      borderColor: 'blue',
      display: 'block'
    },
    {
      backgroundColor: 'red',
      borderColor: 'red',
      borderStyle: 'solid',
      borderWidth: '1px',
      boxSizing: 'border-bx',
      display: 'flex',
      listStyle: 'none',
      marginTop: '0',
      marginEnd: '0',
      marginBottom: '0',
      marginStart: '0',
      paddingTop: '0',
      paddingEnd: '0',
      paddingBottom: '0',
      paddingStart: '0',
      textAlign: 'start',
      textDecoration: 'none',
      whiteSpace: 'pre',
      zIndex: '0'
    }
  );
});

test('merged inline style (mix disabled)', () => {
  styleqNoMix(
    {
      backgroundColor: 'blue',
      borderColor: 'blue',
      display: 'block'
    },
    {
      backgroundColor: 'red',
      borderColor: 'red',
      borderStyle: 'solid',
      borderWidth: '1px',
      boxSizing: 'border-bx',
      display: 'flex',
      listStyle: 'none',
      marginTop: '0',
      marginEnd: '0',
      marginBottom: '0',
      marginStart: '0',
      paddingTop: '0',
      paddingEnd: '0',
      paddingBottom: '0',
      paddingStart: '0',
      textAlign: 'start',
      textDecoration: 'none',
      whiteSpace: 'pre',
      zIndex: '0'
    }
  );
});

suite.run();

/**
 * Print results
 */

const aggregatedResultsString = JSON.stringify(aggregatedResults, null, 2);

// Print / Write results
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const timestamp = `${year}${month}${day}-${hours}${minutes}`;

const dirpath = `${process.cwd()}/logs`;
const filepath = `${dirpath}/perf-${timestamp}.json`;
if (!fs.existsSync(dirpath)) {
  fs.mkdirSync(dirpath);
}
const outpath = outfile || filepath;
fs.writeFileSync(outpath, `${aggregatedResultsString}\n`);

console.log(aggregatedResultsString);
console.log('Results written to', outpath);
