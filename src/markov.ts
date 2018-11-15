import {
  assignIn,
  cloneDeep,
  flatten,
  includes,
  isString,
  sample,
  slice,
  some,
  uniqBy
} from 'lodash'

import {
  MarkovConstructorOptions,
  MarkovCorpusItem,
  MarkovGenerateOptions,
  MarkovResult
} from './types'

const debug = require('debug')
const warn = debug('markov-strings:warning')

export default class Markov {
  public data: Array<{ string: string }>
  public startWords: MarkovCorpusItem[] = []
  public endWords: MarkovCorpusItem[] = []
  public corpus: { [key: string]: MarkovCorpusItem[] } = {}
  public options: MarkovConstructorOptions

  private defaultOptions: MarkovConstructorOptions = {
    stateSize: 2
  }

  /**
   * Creates an instance of Markov generator.
   * @param {(string[] | Array<{ string: string }>)} data An array of strings or objects.
   * If 'data' is an array of objects, each object must have a 'string' attribute
   * @param {any} [options={}] An object of options. If not set, sensible defaults will be used.
   * @memberof Markov
   */
  constructor(
    data: string[] | Array<{ string: string }>,
    options: MarkovConstructorOptions = {}
  ) {
    // Format data if necessary
    if (isString(data[0])) {
      data = (data as string[]).map(s => ({ string: s }))
    } else if (!data[0].hasOwnProperty('string')) {
      throw new Error('Objects in your corpus must have a "string" property')
    }
    this.data = data as Array<{ string: string }>

    // Save options
    this.options = this.defaultOptions
    assignIn(this.options, options)
  }

  /**
   * Builds the corpus
   *
   * @returns {Promise<void>}
   * @memberof Markov
   */
  public buildCorpusAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve(this.buildCorpus())
    })
  }

  /**
   * Builds the corpus (synced method)
   *
   * @memberof Markov
   */
  public buildCorpus(): void {
    const options = this.options

    this.corpus = {}
    this.data.forEach(item => {
      const line = item.string
      const words = line.split(' ')
      const stateSize = options.stateSize!

      // Start words
      const start = slice(words, 0, stateSize).join(' ')
      const oldStartObj = this.startWords.find(o => o.words === start)
      if (oldStartObj) {
        if (!includes(oldStartObj.refs, item)) {
          oldStartObj.refs.push(item)
        }
      } else {
        this.startWords.push({ words: start, refs: [item] })
      }

      // End words
      const end = slice(words, words.length - stateSize, words.length).join(' ')
      const oldEndObj = this.endWords.find(o => o.words === end)
      if (oldEndObj) {
        if (!includes(oldEndObj.refs, item)) {
          oldEndObj.refs.push(item)
        }
      } else {
        this.endWords.push({ words: end, refs: [item] })
      }

      // Build corpus
      for (let i = 0; i < words.length - 1; i++) {
        const curr = slice(words, i, i + stateSize).join(' ')
        const next = slice(words, i + stateSize, i + stateSize * 2).join(' ')
        if (!next || next.split(' ').length !== options.stateSize) {
          continue
        }

        // add block to corpus
        if (this.corpus.hasOwnProperty(curr)) {
          // if corpus already owns this chain
          const oldObj = this.corpus[curr].find(o => o.words === next)
          if (oldObj) {
            oldObj.refs.push(item)
          } else {
            this.corpus[curr].push({ words: next, refs: [item] })
          }
        } else {
          this.corpus[curr] = [{ words: next, refs: [item] }]
        }
      }
    })
  }

  /**
   * Generates a result, that contains a string and its references
   *
   * @param {MarkovGenerateOptions} options
   * @returns {Promise<MarkovResult>}
   * @memberof Markov
   */
  public generateSentenceAsync(
    options: MarkovGenerateOptions
  ): Promise<MarkovResult> {
    return new Promise((resolve, reject) => {
      try {
        const result = this.generateSentence(options)
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Generates a result, that contains a string and its references (synced method)
   *
   * @param {MarkovGenerateOptions} [options={}]
   * @returns {MarkovResult}
   * @memberof Markov
   */
  public generateSentence(options: MarkovGenerateOptions = {}): MarkovResult {
    if (!this.corpus) {
      throw new Error('Corpus is not built.')
    }

    const newOptions: MarkovGenerateOptions = {}
    assignIn(newOptions, this.options, options)
    options = newOptions

    const corpus = cloneDeep(this.corpus)
    const max = options.maxTries!

    // loop for maximum tries
    for (let i = 0; i < max; i++) {
      let ended = false
      const arr = [sample(this.startWords)!]
      let score = 0

      // loop to build sentence
      let limit = 0
      while (limit < max) {
        const block = arr[arr.length - 1] // last value in array
        const state = sample(corpus[block.words])

        // sentence cannot be finished
        if (!state) {
          break
        }

        // add new state to list
        arr.push(state)

        // increment score
        score += corpus[block.words].length - 1 // increment score

        // is sentence finished?
        if (some(this.endWords, { words: state.words })) {
          ended = true
          break
        }
        limit++
      }
      const scorePerWord = Math.ceil(score / arr.length)

      const sentence = arr
        .map(o => o.words)
        .join(' ')
        .trim()
      const result = {
        string: sentence,
        score,
        scorePerWord,
        refs: uniqBy(flatten(arr.map(o => o.refs)), 'string')
      }

      // sentence is not ended or incorrect
      if (
        !ended ||
        (typeof options.filter === 'function' && !options.filter(result)) ||
        (options.minWords &&
          options.minWords > 0 &&
          sentence.split(' ').length < options.minWords) ||
        (options.maxWords &&
          options.maxWords > 0 &&
          sentence.split(' ').length > options.maxWords) ||
        (options.maxLength &&
          options.maxLength > 0 &&
          sentence.length > options.maxLength) ||
        (options.minScore && score < options.minScore) ||
        (options.minScorePerWord && scorePerWord < options.minScorePerWord)
      ) {
        continue
      }

      return result
    }
    throw new Error('Cannot build sentence with current corpus and options')
  }
}
