'use strict';

var _ = require('lodash');

class Generator {
  constructor(data, options) {
    this.data = data;
    this.corpus = {};
    this.startWords = [];
    this.endWords = [];

    this.defaultOptions = {
      stateSize: 2,
      maxLength: 0,
      minWords : 5,
      maxWords : 0,
      minScore : 0
    };

    // Save options
    options = options ? options : {};
    this.options = this.defaultOptions;
    _.extend(this.options, options);

    this.buildCorpus();
  }

  buildCorpus() {
    let options = this.options;

    this.data.forEach(line => {
      let words = line.split(' ');

      // Start words
      let start = _.slice(words, 0, options.stateSize).join(' ');
      if (!_.includes(this.startWords, start)) {
        this.startWords.push(start);
      }

      // End words
      var end = _.slice(words, words.length - options.stateSize, words.length).join(' ');
      if (!_.includes(this.endWords, end)) {
        this.endWords.push(end);
      }

      // Build corpus
      for (var i = 0; i < words.length - 1; i++) {
        var curr = _.slice(words, i, i + options.stateSize).join(' ');
        var next = _.slice(words, i + options.stateSize, i + options.stateSize * 2).join(' ');
        if (!next || next.split(' ').length != options.stateSize) {
          continue;
        }

        // Add block to corpus
        if (this.corpus.hasOwnProperty(curr)) {
          if (!_.includes(this.corpus[curr], next)) {
            this.corpus[curr].push(next);
          }
        }
        else {
          this.corpus[curr] = [next];
        }
      }
    });
  }

  generateSentence(options, check) {
    options = options ? options : {};
    _.assignIn(options, this.options);

    let corpus = _.cloneDeep(this.corpus);
    let max = 10000, iter = 0;

    // Loop for maximum tries
    for (let i = 0; i < max; i++) {
      let ended = false;
      let arr = [_.sample(this.startWords)];
      let score = 0;

      // Loop to build sentence
      while (true) {
        let key = arr[arr.length - 1]; // Last value in array
        let state = _.sample(corpus[key]);

        // Sentence cannot be finished
        if (!state) {
          break;
        }

        // Add new state to list
        arr.push(state);

        // Increment score
        score += corpus[key].length - 1; // Increment score

        // Is sentence finished?
        if (_.includes(this.endWords, state)) {
          ended = true;
          break;
        }
      }

      const sentence = arr.join(' ').trim();

      // Sentence is not ended or incorrect
      if (
        !ended
        || options.minWords > 0 && sentence.split(' ').length < options.minWords
        || options.maxWords > 0 && sentence.split(' ').length > options.maxWords
        || options.maxLength > 0 && sentence.length > options.maxLength
        || score < options.minScore
        || typeof check === 'function' && !check(sentence)
      ) {
        continue;
      }

      return {string: sentence, score: score};
    }

    throw new Error('Cannot build sentence with current corpus and options');
  }

  _parseOption(options, name) {
    return options[name] ? options[name] : this.defaultOptions[name];
  }

  parseOptions(options) {
    options.stateSize = this._parseOption(options, 'stateSize');
    options.maxLength = this._parseOption(options, 'maxLength');
    options.minWords = this._parseOption(options, 'minWords');
    options.minScore = this._parseOption(options, 'minScore');
    return options;
  }

}

module.exports = Generator;