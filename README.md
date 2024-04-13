[![Build Status](https://travis-ci.org/scambier/markov-strings.svg?branch=master)](https://travis-ci.org/scambier/markov-strings)
[![Coverage Status](https://coveralls.io/repos/github/scambier/markov-strings/badge.svg?branch=master)](https://coveralls.io/github/scambier/markov-strings?branch=master)
[![npm version](https://badge.fury.io/js/markov-strings.svg)](https://badge.fury.io/js/markov-strings)


---
! This is the readme for markov-strings **3.x.x.** - The docs for the older **2.x.x** are [here](https://github.com/scambier/markov-strings/tree/v2) !

---

# Markov-strings

A simplistic Markov chain text generator.
Give it an array of strings, and it will output a randomly generated string.

<sup><i>A rust port of this library is available [here](https://github.com/scambier/markov-strings-rust).</i></sup>

This module was created for the Mastodon bot [@BelgicaNews](https://botsin.space/@BelgicaNews).

- [Markov-strings](#markov-strings)
  - [Prerequisites](#prerequisites)
  - [Installing](#installing)
  - [Usage](#usage)
  - [API](#api)
    - [`new Markov([options])`](#new-markovoptions)
    - [`.addData(data)`](#adddatadata)
    - [`.generate([options])`](#generateoptions)
    - [`.export()` and `.import(data)`](#export-and-importdata)
  - [Unit tests](#unit-tests)
  - [Changelog](#changelog)
  - [Running the tests](#running-the-tests)

## Prerequisites

Built and tested with NodeJS 18

## Installing

`npm install --save markov-strings`

## Usage

```js
import Markov from 'markov-strings'
// Not recommended: you can use `require()` if needed, instead of `import`
// const Markov = require('markov-strings').default

// Build the Markov generator
const markov = new Markov({ stateSize: 2 })

// Add data for the generator
const data = [/* insert a few hundreds/thousands sentences here */]
markov.addData(data)

const options = {
  maxTries: 20, // Give up if I don't have a sentence after 20 tries (default is 10)

  // If you want to get seeded results, you can provide an external PRNG.
  prng: Math.random, // Default value if left empty

  // You'll often need to manually filter raw results to get something that fits your needs.
  filter: (result) => {
    return result.string.split(' ').length >= 5 && // At least 5 words
           result.string.endsWith('.')             // End sentences with a dot.
  }
}

// Generate a sentence
const result = markov.generate(options)
console.log(result)
/*
{
  string: 'lorem ipsum dolor sit amet etc.',
  score: 42,
  tries: 5,
  refs: [ an array of objects ]
}
*/
```

Markov-strings is built in TypeScript, and exports several types to help you. Take a look at [the source](https://github.com/scambier/markov-strings/blob/master/src/index.ts) to see how it works.

## API

### `new Markov([options])`

Create a generator instance.

#### options

```js
{
  stateSize: number
}
```

The `stateSize` is the number of words for each "link" of the generated sentence. `1` will output gibberish sentences without much sense. `2` is a sensible default for most cases. `3` and more can create good sentences if you have a corpus that allows it.

### `.addData(data)`

To function correctly, the Markov generator needs its internal data to be correctly structured. `.addData(data)` allows you add raw data, that is automatically formatted to fit the internal structure.

You can call `.addData(data)` as often as you need, **with new data each time (!)**. Multiple calls of `.addData()` with the same data is not recommended, because it will skew the random generation of results.

#### data

```js
string[] | Array<{ string: string }>
```

`data` is an array of strings (sentences), or an array of objects. If you wish to use objects, each one must have a `string` attribute. The bigger the array, the better and more varied the results.

Examples:

```js
[ 'lorem ipsum', 'dolor sit amet' ]
```

or

```js
[
  { string: 'lorem ipsum', attr: 'value' },
  { string: 'dolor sit amet', attr: 'other value' }
]
```

The additionnal data passed with objects will be returned in the `refs` array of the generated sentence.

### `.generate([options])`

Returns an object of type `MarkovResult`:

```ts
{
  string: string, // The resulting sentence
  score: number,  // A relative "score" based on the number of possible permutations. Higher is "better", but the actual value depends on your corpus
  refs: Array<{ string: string }>, // The array of references used to build the sentence
  tries: number   // The number of tries it took to output this result
}
```

The `refs` array will contain all objects that have been used to build the sentence. May be useful to fetch meta data or make stats.

#### options

```ts
{
  maxTries: number // The max number of tentatives before giving up (default is 10)
  prng: Math.random, // An external Pseudo Random Number Generator if you want to get seeded results
  filter: (result: MarkovResult) => boolean // A callback to filter results (see example above)
}
```

### `.export()` and `.import(data)`

You can export and import the markov built corpus. The exported data is a serializable object, and must be deserialized before being re-imported.

[Example use-case](https://github.com/scambier/markov-strings/issues/9)

## Running the tests

`npm test`
