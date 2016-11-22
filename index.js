'use strict';

const _ = require('lodash'),
  debug = require('debug')('markov-strings');

class Generator {
  /**
   * Constructor
   * @param data An array of strings or objects. If 'data' is an array of objects, each object must have a 'string' attribute
   * @param options An object of options. If not set, sensible defaults will be used.
   */
  constructor(data, options = {}) {
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
    this.options = this.defaultOptions;
    _.assignIn(this.options, options);
  }

  formatData(data) {
    if (_.isString(data[0])) {
      // If data is an array of strings, wrap them into objects
      const newData = [];
      data.forEach(string => {
        newData.push({
          string: string
        })
      })
      return newData;
    }
    if (!data[0].hasOwnProperty('string')) {
      throw new Error('Objects in your corpus must have a "string" property');
    }
    return data;
  }

  buildCorpus() {
    return new Promise((resolve, reject) => {
      resolve(this.buildCorpusSync());
    });
  }

  buildCorpusSync() {
    const options = this.options;

    this.data = this.formatData(this.data);

    this.corpus = {};
    this.data.forEach(item => {
      const line = item.string;
      const words = line.split(' ');

      // Start words
      const start = _.slice(words, 0, options.stateSize).join(' ');
      const oldStartObj = _.find(this.startWords, o => o.words == start);
      if (oldStartObj) {
        if (!_.includes(oldStartObj.refs, item)) { oldStartObj.refs.push(item); }
      } else {
        this.startWords.push({ words: start, refs: [item] });
      }

      // End words
      const end = _.slice(words, words.length - options.stateSize, words.length).join(' ');
      const oldEndObj = _.find(this.endWords, o => o.words == end);
      if (oldEndObj) {
        if (!_.includes(oldEndObj.refs, item)) { oldEndObj.refs.push(item); }
      } else {
        this.endWords.push({ words: end, refs: [item] });
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
          // If corpus already owns this chain
          const oldObj = _.find(this.corpus[curr], o => o.words == next);
          if (oldObj) {
            oldObj.refs.push(item);
          } else {
            this.corpus[curr].push({ words: next, refs: [item] })
          }
        } else {
          this.corpus[curr] = [{ words: next, refs: [item] }];
        }
      }
    });
  }

  generateSentence(options) {
    return new Promise((resolve, reject) => {
      try {
        const result = this.generateSentenceSync(options);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  }

  generateSentenceSync(options = {}) {
    if (!this.corpus) {
      throw new Error('Corpus is not built.')
    }
    const newOptions = {};
    _.assignIn(newOptions, this.options, options);
    options = newOptions;

    const corpus = _.cloneDeep(this.corpus);
    const max = options.maxTries;

    // Loop for maximum tries
    for (let i = 0; i < max; i++) {
      let ended = false;
      const arr = [_.sample(this.startWords)];
      let score = 0;

      // Loop to build sentence
      let limit = 0;
      while (limit < max) {
        const block = arr[arr.length - 1]; // Last value in array
        const state = _.sample(corpus[block.words]);

        // Sentence cannot be finished
        if (!state) {
          break;
        }

        // Add new state to list
        arr.push(state);

        // Increment score
        score += corpus[block.words].length - 1; // Increment score

        // Is sentence finished?
        if (_.some(this.endWords, { words: state.words })) {
          ended = true;
          break;
        }
        limit++;
      }
      const scorePerWord = parseInt(score / arr.length);

      const sentence = _.map(arr, 'words').join(' ').trim();

      // Sentence is not ended or incorrect
      if (!ended ||
        typeof options.checker === 'function' && !options.checker(sentence) || // checker cb returns false
        options.minWords > 0 && sentence.split(' ').length < options.minWords ||
        options.maxWords > 0 && sentence.split(' ').length > options.maxWords ||
        options.maxLength > 0 && sentence.length > options.maxLength ||
        score < options.minScore ||
        scorePerWord < options.minScorePerWord
      ) {
        continue;
      }

      return {
        string: sentence,
        score: score,
        scorePerWord: scorePerWord,
        refs: _.uniqBy(_.flatten(_.map(arr, 'refs')), 'string')
      };
    }
    throw new Error('Cannot build sentence with current corpus and options');
  }
}

module.exports = Generator;
