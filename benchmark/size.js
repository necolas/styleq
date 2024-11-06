/**
 * Copyright (c) Nicolas Gallagher
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const brotliSizePkg = require('brotli-size');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { minify_sync } = require('terser');

// run.js --outfile filename.js
const argv = yargs(hideBin(process.argv)).option('outfile', {
  alias: 'o',
  type: 'string',
  description: 'Output file',
  demandOption: false,
}).argv;
const outfile = argv.outfile;

const files = [
  path.join(__dirname, '../dist/styleq.js'),
  path.join(__dirname, '../dist/transform-localize-style.js'),
];

console.log('Running benchmark-size, please wait...');

const sizes = files.map((file) => {
  const code = fs.readFileSync(file, 'utf8');
  const result = minify_sync(code).code;
  const minified = Buffer.byteLength(result, 'utf8');
  const compressed = brotliSizePkg.sync(result);
  return { file, compressed, minified };
});

const aggregatedResults = {};
sizes.forEach((entry) => {
  const { file, minified, compressed } = entry;
  const filename = file.split('dist/')[1];
  aggregatedResults[filename] = {
    compressed,
    minified,
  };
});

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
const filepath = `${dirpath}/size-${timestamp}.json`;
if (!fs.existsSync(dirpath)) {
  fs.mkdirSync(dirpath);
}
const outpath = outfile || filepath;
fs.writeFileSync(outpath, `${aggregatedResultsString}\n`);

console.log(aggregatedResultsString);
console.log('Results written to', outpath);
