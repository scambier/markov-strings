'use strict';

const _ = require('lodash');

class Generator {
  constructor(data, options) {
    this.data = data;
    this.corpus = undefined;
    this.startWords = [];
    this.endWords = [];

    this.defaultOptions = {
      stateSize: 2,
      maxLength: 0,
      minWords: 0,
      maxWords: 0,
      minScore: 0,
      minScorePerWord: 0,
      maxTries: 10000
    };

    // Save options
    options = options ? options : {};
    this.options = this.defaultOptions;
    _.assignIn(this.options, options);
  }

  buildCorpus() {
    return new Promise((resolve, reject) => {
      resolve(this.buildCorpusSync());
    });
  }

  buildCorpusSync() {
    const options = this.options;

    this.corpus = {};
    this.data.forEach(line => {
      const words = line.split(' ');

      // Start words
      const start = _.slice(words, 0, options.stateSize).join(' ');
      if (!_.includes(this.startWords, start)) {
        this.startWords.push(start);
      }

      // End words
      const end = _.slice(words, words.length - options.stateSize, words.length).join(' ');
      if (!_.includes(this.endWords, end)) {
        this.endWords.push(end);
      }

      // Build corpus
      for (let i = 0; i < words.length - 1; i++) {
        const curr = _.slice(words, i, i + options.stateSize).join(' ');
        const next = _.slice(words, i + options.stateSize, i + options.stateSize * 2).join(' ');
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

  generateSentence(options) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.generateSentenceSync(options))
      }
      catch (e) {
        reject(e);
      }
    });
  }

  generateSentenceSync(options) {
    if (!this.corpus) {
      throw new Error('Corpus is not built.')
    }
    options = options ? options : {};
    _.assignIn(this.options, options);
    options = this.options;

    const corpus = _.cloneDeep(this.corpus);
    const max = options.maxTries;

    // Loop for maximum tries
    for (let i = 0; i < max; i++) {
      let ended = false;
      const arr = [_.sample(this.startWords)];
      let score = 0;

      // Loop to build sentence
      while (true) {
        const key = arr[arr.length - 1]; // Last value in array
        const state = _.sample(corpus[key]);

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
      const scorePerWord = parseInt(score/arr.length);

      const sentence = arr.join(' ').trim();

      // Sentence is not ended or incorrect
      if (
        !ended
        || typeof options.checker === 'function' && !options.checker(sentence)
        || options.minWords > 0 && sentence.split(' ').length < options.minWords
        || options.maxWords > 0 && sentence.split(' ').length > options.maxWords
        || options.maxLength > 0 && sentence.length > options.maxLength
        || score < options.minScore
        || scorePerWord < options.minScorePerWord
      ) {
        continue;
      }

      return {string: sentence, score: score, scorePerWord: scorePerWord};
    }

    throw new Error('Cannot build sentence with current corpus and options');
  }
}

module.exports = Generator;