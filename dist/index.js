"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class Markov {
    /**
     * Creates an instance of Markov generator.
     *
     * @param {(string[] | Array<{ string: string }>)} data An array of strings or objects.
     * If 'data' is an array of objects, each object must have a 'string' attribute
     * @param {MarkovConstructorOptions} [options={}]
     * @memberof Markov
     */
    constructor(data, options = {}) {
        this.startWords = [];
        this.endWords = [];
        this.corpus = {};
        this.defaultOptions = {
            stateSize: 2
        };
        // Format data if necessary
        if (lodash_1.isString(data[0])) {
            data = data.map(s => ({ string: s }));
        }
        else if (!data[0].hasOwnProperty('string')) {
            throw new Error('Objects in your corpus must have a "string" property');
        }
        this.data = data;
        // Save options
        this.options = this.defaultOptions;
        lodash_1.assignIn(this.options, options);
    }
    /**
     * Builds the corpus. You must call this before generating sentences.
     *
     * @memberof Markov
     */
    buildCorpus() {
        const options = this.options;
        this.data.forEach(item => {
            const line = item.string;
            const words = line.split(' ');
            const stateSize = options.stateSize; // Default value of 2 is set in the constructor
            // Start words
            const start = lodash_1.slice(words, 0, stateSize).join(' ');
            const oldStartObj = this.startWords.find(o => o.words === start);
            if (oldStartObj) {
                if (!lodash_1.includes(oldStartObj.refs, item)) {
                    oldStartObj.refs.push(item);
                }
            }
            else {
                this.startWords.push({ words: start, refs: [item] });
            }
            // End words
            const end = lodash_1.slice(words, words.length - stateSize, words.length).join(' ');
            const oldEndObj = this.endWords.find(o => o.words === end);
            if (oldEndObj) {
                if (!lodash_1.includes(oldEndObj.refs, item)) {
                    oldEndObj.refs.push(item);
                }
            }
            else {
                this.endWords.push({ words: end, refs: [item] });
            }
            // Build corpus
            for (let i = 0; i < words.length - 1; i++) {
                const curr = lodash_1.slice(words, i, i + stateSize).join(' ');
                const next = lodash_1.slice(words, i + stateSize, i + stateSize * 2).join(' ');
                if (!next || next.split(' ').length !== options.stateSize) {
                    continue;
                }
                // add block to corpus
                if (this.corpus.hasOwnProperty(curr)) {
                    // if corpus already owns this chain
                    const oldObj = this.corpus[curr].find(o => o.words === next);
                    if (oldObj) {
                        oldObj.refs.push(item);
                    }
                    else {
                        this.corpus[curr].push({ words: next, refs: [item] });
                    }
                }
                else {
                    this.corpus[curr] = [{ words: next, refs: [item] }];
                }
            }
        });
    }
    /**
     * `.buildCorpus()` wrapped inside a Promise
     *
     * @returns {Promise<void>}
     * @memberof Markov
     */
    buildCorpusAsync() {
        return new Promise((resolve, reject) => {
            try {
                this.buildCorpus();
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Generates a result, that contains a string and its references
     *
     * @param {MarkovGenerateOptions} [options={}]
     * @returns {MarkovResult}
     * @memberof Markov
     */
    generate(options = {}) {
        if (lodash_1.isEmpty(this.corpus)) {
            throw new Error('Corpus is not built');
        }
        const corpus = lodash_1.cloneDeep(this.corpus);
        const maxTries = options.maxTries ? options.maxTries : 10;
        let tries;
        // We loop through fragments to create a complete sentence
        for (tries = 1; tries <= maxTries; tries++) {
            let ended = false;
            // Create an array of MarkovCorpusItems
            // The first item is a random startWords element
            const arr = [lodash_1.sample(this.startWords)];
            let score = 0;
            // loop to build a complete sentence
            for (let innerTries = 0; innerTries < maxTries; innerTries++) {
                const block = arr[arr.length - 1]; // last value in array
                const state = lodash_1.sample(corpus[block.words]); // Find a following item in the corpus
                // If a state cannot be found, the sentence can't be completed
                if (!state) {
                    break;
                }
                // add new state to list
                arr.push(state);
                // increment score
                score += corpus[block.words].length - 1; // increment score
                // is sentence finished?
                if (lodash_1.some(this.endWords, { words: state.words })) {
                    ended = true;
                    break;
                }
            }
            const sentence = arr
                .map(o => o.words)
                .join(' ')
                .trim();
            const result = {
                string: sentence,
                score,
                refs: lodash_1.uniqBy(lodash_1.flatten(arr.map(o => o.refs)), 'string'),
                tries
            };
            // sentence is not ended or incorrect
            if (!ended || (typeof options.filter === 'function' && !options.filter(result))) {
                continue;
            }
            return result;
        }
        throw new Error(`Failed to build a sentence after ${tries - 1} tries`);
    }
    /**
     * `.generate()` wrapped inside a Promise
     *
     * @param {MarkovGenerateOptions} options
     * @returns {Promise<MarkovResult>}
     * @memberof Markov
     */
    generateAsync(options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const result = this.generate(options);
                resolve(result);
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.default = Markov;
