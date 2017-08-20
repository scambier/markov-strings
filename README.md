[![Build Status](https://travis-ci.org/scambier/markov-strings.svg?branch=master)](https://travis-ci.org/scambier/markov-strings)
[![Coverage Status](https://coveralls.io/repos/github/scambier/markov-strings/badge.svg?branch=master)](https://coveralls.io/github/scambier/markov-strings?branch=master)
[![npm version](https://badge.fury.io/js/markov-strings.svg)](https://badge.fury.io/js/markov-strings) [![dep](https://david-dm.org/scambier/markov-strings.svg)](https://david-dm.org/scambier/markov-strings#info=devDependencies)


# Markov-strings
A simplistic Markov chain text generator.  
Give it an array of strings, and it will output a randomly generated string.

This module was created for the Twitter bot [@BelgicaNews](https://twitter.com/BelgicaNews).

<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Prerequisites](#prerequisites)
- [Installing](#installing)
- [Usage](#usage)
- [API](#api)
	- [new Markov(data, [options])](#new-markovdata-options)
		- [data](#data)
		- [options](#options)
			- [stateSize](#statesize)
			- [maxLength](#maxlength)
			- [minWords](#minwords)
			- [maxWords](#maxwords)
			- [minScore](#minscore)
			- [minScorePerWord](#minscoreperword)
			- [maxTries](#maxtries)
			- [checker(sentence)](#checkersentence)
	- [markov.buildCorpus()](#markovbuildcorpus)
	- [markov.generateSentence([options])](#markovgeneratesentenceoptions)
		- [options](#options)
- [Changelog](#changelog)
	- [1.3.3](#133)
	- [1.3.2](#132)
	- [1.3.1](#131)
	- [1.3.0](#130)
- [Running the tests](#running-the-tests)

<!-- /TOC -->

## Prerequisites
This module makes use of ES6 features.

## Installing
`npm install --save markov-strings`

## Usage
```javascript
const Markov = require('markov-strings');


// 1) Simple way

const data = [/* insert a few hundreds/thousands sentences here */];
const markov = new Markov(data);
markov.buildCorpusSync();
const result = markov.generateSentenceSync();
console.log(result);
/*
{
  string: 'lorem ipsum dolor sit amet etc',
  score: 42,
  scorePerWord: 7,
  refs: [ an array of objects ]
}
*/



// 2) More complete way with options and Promises

const data = [/* insert a few hundreds/thousands objects here, each one with a "string" attribute */];

// Some options to generate Twitter-ready strings
const options = {
  maxLength: 140,
  minWords: 10,
  minScore: 25,
  checker: sentence => {
    return sentence.endsWith('.'); // I want my tweets to end with a dot.
  }
};

// Instantiate the generator
const markov = new Markov(data, options);


// Build the corpus
markov.buildCorpus()
  .then(() => {

    // Generate some tweets
    const tweets = [];
    for (let i = 0; i < 10; i++) {
      markov.generateSentence()
        .then(result => {
          tweets.push(result);
        });
    }

    // Generate a shorter tweet to add a link
    markov.generateSentence({
        maxLength: 140 - 24
      })
      .then(shorterTweet => {
        shorterTweet.string += ' https://github.com/scambier/markov-strings'; // Links always take 23 characters in a tweet

        console.log(shorterTweet);
        /*
        {
          string: 'lorem ipsum dolor sit amet etc. https://github.com/scambier/markov-strings',
          score: 42,
          scorePerWord: 7,
          refs: [ an array of objects ]
        }
        */
      })
  });
```

## API

### new Markov(data, [options])
Create a generator instance.

#### data
Type: `array`

`data` is an array of strings (sentences), or an array of objects. If you wish to use objects, each one must have a `string` attribute. The bigger the array, the better and more various the results.

Examples:  
`[ 'lorem ipsum', 'dolor sit amet' ]` or `[ { string: 'lorem ipsum', attr: 'value' }, { string: 'dolor sit amet', attr: 'other value' } ]`

#### options
Type: `object`

You can provide options during the generator instantiation, and/or while calling `generateSentence()`.

The `options` object will alter the quality, length, etc. of the generated sentences.

Options given to `generateSentence()` overwrite those given during instantiation.
It can be useful if you wish to generate multiple sentences with slight variations each time.

##### stateSize
Type: `integer`  
Default: `2`

Note: this option cannot be used in `generateSentence()`

The number of words for each state.  
`1` will output gibberish sentences without much sense.  
`2` is a sensible default.  
`3` and more could create good sentences, at the expense of randomness. You'll need a good corpus, though.

##### maxLength
Type: `integer`  
Default: `0`

Maximum characters.

##### minWords
Type: `integer`  
Default: `5`

Minimum number of words.

##### maxWords
Type: `integer`  
Default: `0`

Maximum number of words.

##### minScore
Type: `integer`  
Default: `0`

Each generated sentence will be associated to a score. The highest this score, the more random the sentence should be.

A good `minScore` value totally depends of your corpus, and the number of words of the sentence, so you'll have to try yourself.

##### minScorePerWord
Type: `integer`  
Default: `0`

Same as above, but averaged for each word in the returned sentence.

##### maxTries
Type: `integer`  
Default: `10000`

Sentence generation can (will) take multiple tries to create one that will fulfill all restrictions.
If this value is exceeded, an error will be thrown.

##### checker(sentence)
Type: `function`  

In addition to all previous options, you can define your own checking function that will be called once the sentence is generated.
If this callback returns `false`, the sentence is rejected and a new one is generated.


### markov.buildCorpus()
Return a Promise that will resolve to nothing.  
Synced function: `markov.buildCorpusSync()`

This function **must** be called to build the corpus for Markov generation.  
It will iterate over all words for all strings from your `data` parameter, so it can take some time depending on its size.

### markov.generateSentence([options])
Return a Promise that will resolve to an object `{string, score, scorePerWord, refs}`  
Synced function: `markov.generateSentenceSync()`

The `refs` array will contain all objects that have been used to build the sentence. May be useful to fetch some meta data or make some stats.

#### options
Type: `object`

If set, these options will take precedence over those set in the constructor.

## Changelog

### 1.3.3
- Updated README. Version bump for npm

### 1.3.2
- Fixed an infinite loop bug
- Performance improvement

### 1.3.1
- Updated README example
- Removed a useless line

### 1.3.0
- New feature: the generator now accepts arrays of objects, and tells the user which objects were used to build a sentence
- Fixed all unit tests
- Added a changelog

## Running the tests
`npm test`
