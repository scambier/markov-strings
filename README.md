[![Build Status](https://travis-ci.org/scambier/markov-strings.svg?branch=master)](https://travis-ci.org/scambier/markov-strings)
[![Coverage Status](https://coveralls.io/repos/github/scambier/markov-strings/badge.svg?branch=master)](https://coveralls.io/github/scambier/markov-strings?branch=master)
[![npm version](https://badge.fury.io/js/markov-strings.svg)](https://badge.fury.io/js/markov-strings) [![dep](https://david-dm.org/scambier/markov-strings.svg)](https://david-dm.org/scambier/markov-strings#info=devDependencies)


# Markov-strings
A simplistic Markov chain text generator.  
Give it an array of strings, and it will output a randomly generated string.

This module was created for the Twitter bot [@BelgicaNews](https://twitter.com/BelgicaNews).

- [Markov-strings](#markov-strings)
  - [Prerequisites](#prerequisites)
  - [Installing](#installing)
  - [Usage](#usage)
  - [API](#api)
    - [new Markov(data, [options])](#new-markovdata-options)
    - [.buildCorpus()](#buildcorpus)
    - [.generate([options])](#generateoptions)
  - [Changelog](#changelog)
  - [Running the tests](#running-the-tests)

## Prerequisites

This module makes use of ES6 features.

## Installing

`npm install --save markov-strings`

## Usage

```js
const Markov = require('markov-strings').default
// or
import Markov from 'markov-strings'

const data = [/* insert a few hundreds/thousands sentences here */]

// Build the Markov generator
const markov = new Markov(data, { stateSize: 2 })
markov.buildCorpus()

const options = {
  maxTries: 20, // Give up if I don't have a sentence after 20 tries (default is 10)
  filter: (result) => {
    return
      result.string.split(' ').length >= 5 && // At least 5 words
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

## API

### new Markov(data, [options])

Create a generator instance.

#### data

```js
string[] | Array<{ string: string }>
```

`data` is an array of strings (sentences), or an array of objects. If you wish to use objects, each one must have a `string` attribute. The bigger the array, the better and more various the results.

Examples:

`[ 'lorem ipsum', 'dolor sit amet' ]`  
or  
```
[
  { string: 'lorem ipsum', attr: 'value' },
  { string: 'dolor sit amet', attr: 'other value' }
]
```

#### options

```js
{
  stateSize: number
}
```

The `stateSize` is the number of words for each "link" of the generated sentence. `1` will output gibberish sentences without much sense. `2` is a sensible default for most cases. `3` and more can create good sentences if you have a corpus that allows it.

### .buildCorpus()

This function **must** be called to build the corpus for Markov generation.
It will iterate over all words from your `data` parameter to create an internal optimized structure.

Since `.buildCorpus()` can take some time (it loops for each word of each string), a non-blocking variant `.buildCorpusAsync()` is conveniently available if you need it.

### .generate([options])

Returns an object of type `MarkovResult`:

```ts
{
  string: string, // The resulting sentence
  score: number,  // A relative "score" based on the number of possible permutations. Higher is "better", but the actual value depends on your corpus
  refs: Array<{ string: string }>, // The array of references used to build the sentence
  tries: number   // The number of tries it took to output this result
}
```

The `refs` array will contain all objects that have been used to build the sentence. May be useful to fetch some meta data or make some stats.


Since `.generate()` can potentially take several seconds or more, a non-blocking variant `.generateAsync()` is conveniently available if you need it.

#### options

```ts
{
  maxTries: number // The max number of tentatives before giving up (default is 10)
  filter: (result: MarkovResult) => boolean // A callback to filter results (see example above)
}
```

## Changelog

#### 2.0.0

- **Refactoring with breaking changes**
- The constructor and generator take two different options objects
- Most of generator options are gone, except `filter` and `maxTries`
- Tests have been rewritten with jest, in TypeScript

#### 1.5.0

- Code rewritten in TypeScript. You can now `import MarkovGenerator from  'markov-strings'`

#### 1.4.0

- New `filter()` method, thanks @flpvsk

#### 1.3.4 - 1.3.5

- Dependencies update

#### 1.3.3

- Updated README. Version bump for npm

#### 1.3.2

- Fixed an infinite loop bug
- Performance improvement

#### 1.3.1

- Updated README example
- Removed a useless line

#### 1.3.0

- New feature: the generator now accepts arrays of objects, and tells the user which objects were used to build a sentence
- Fixed all unit tests
- Added a changelog

## Running the tests

`npm test`
