[![Build Status](https://travis-ci.org/scambier/markov-strings.svg?branch=master)](https://travis-ci.org/scambier/markov-strings)
[![Coverage Status](https://coveralls.io/repos/github/scambier/markov-strings/badge.svg?branch=master)](https://coveralls.io/github/scambier/markov-strings?branch=master)
[![npm version](https://badge.fury.io/js/markov-strings.svg)](https://badge.fury.io/js/markov-strings)

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Markov-strings](#markov-strings)
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
	- [Running the tests](#running-the-tests)

<!-- /TOC -->

# Markov-strings

A simplistic Markov chain text generator.  
Give it an array of strings, and it will output a randomly generated string.

This module was created for the Twitter bot [@BelgicaNews](https://twitter.com/BelgicaNews).


## Prerequisites
This module makes use of ES6 features.

## Installing
`npm install --save markov-strings`

## Usage

```javascript
const Markov = require('markov-strings');

// An array of strings
const data = [/* insert a few hundreds/thousands sentences here */];

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
        shorterTweet += ' https://github.com/scambier/markov-strings'; // Links always take 23 characters in a tweet

        console.log(shorterTweet);
        /*
         Possible output:
         {
           string: 'lorem ipsum dolor sit amet etc. https://github.com/scambier/markov-strings',
           score: 42
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

`data` is an array of strings (sentences). The bigger the array, the better and more various the results.

#### options
Type: `object`

You can provide options during the generator instantiation, and/or while calling `generateSentence()`.

The `options` object will alter the quality, length, etc. of the generated sentences.

Options given to `generateSentence()` overwrite those given during instantiation.
It can be useful if you wish to generate multiple sentences with slight variations each time.

##### stateSize
Type: `integer`  
Default: `2`

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


#### markov.buildCorpus()
Return a Promise that will resolve to nothing.  
Synced function: `markov.buildCorpusSync()`

This function **must** be called to build the corpus for Markov generation.  
It will iterate over all words for all strings from your `data` parameter, so it can take some time depending on its size.

#### markov.generateSentence([options])
Return a Promise that will resolve to an object `{string, score}`  
Synced function: `markov.generateSentenceSync()`

##### options
Type: `object`

If set, these options will take precedence over those set in the constructor.

## Running the tests
`npm test`
