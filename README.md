[![Build Status](https://travis-ci.org/scambier/markov-strings.svg?branch=master)](https://travis-ci.org/scambier/markov-strings)
[![Coverage Status](https://coveralls.io/repos/github/scambier/markov-strings/badge.svg?branch=master)](https://coveralls.io/github/scambier/markov-strings?branch=master)

#Markov-strings

A simplistic Markov chain text generator.

Give it an array of strings, and it will output a randomly generated string.

##Getting started

###Prerequisites
This module makes use of ES6 features.

###Installing
`npm install --save markov-chains`

###Basic usage

```javascript
let Markdown = require('markov-strings');

let data = [];    // An array of strings
let options = {}; // An optional object of options
let generator = new Markov(data, options);

let refinedOptions = {}; // An optional object of options, for this particular generation
generator.generateSentence(refinedOptions);  // Outputs an a object, containing a string and a score
```

###Options
You can provide options during the generator instantiation, and/or while calling `generateSentence()`.

The `options` object will alter the quality, length, etc. of the generated sentences. 

Options given to `generateSentence()` overwrite those given during instantiation.
It can be useful if you wish to generate multiple sentences with slight variations each time.

#####stateSize
Type: `integer`  
Default: `2`

The number of words for each state.  
`1` will output gibberish sentences without much sense.  
`2` is a sensible default.  
`3` and more could create good sentences, at the expense of randomness. You'll need a good corpus, though.

#####maxLength
Type: `integer`  
Default: `0`

Maximum characters.

#####minWords
Type: `integer`  
Default: `5`

Minimum number of words.

#####maxWords
Type: `integer`  
Default: `0`

Maximum number of words.

#####minScore
Type: `integer`  
Default: `0`

Each generated sentence will be associated to a score. The highest this score, the more random the sentence should be.

A good `minScore` value totally depends of your corpus, and the number of words of the sentence, so you'll have to try yourself.

## Running the tests
`npm test`