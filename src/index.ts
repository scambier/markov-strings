import { MarkovCorpusItem, MarkovOptions, MarkovResult } from "./types"

const _ = require("lodash")
const debug = require("debug")
const warn = debug("markov-strings:warning")

class Markov {

  public data: Array<{ string: string }>
  public startWords: MarkovCorpusItem[] = []
  public endWords: MarkovCorpusItem[] = []
  public corpus: { [key: string]: MarkovCorpusItem[] } = {}
  public options: MarkovOptions
  private defaultOptions: MarkovOptions = {
    stateSize: 2,
    maxLength: 0,
    minWords: 0,
    maxWords: 0,
    minScore: 0,
    minScorePerWord: 0,
    maxTries: 10000,
    checker: undefined,
    filter: undefined
  }

  /**
   * Creates an instance of Markov generator.
   * @param {(string[] | Array<{ string: string }>)} data An array of strings or objects.
   * If 'data' is an array of objects, each object must have a 'string' attribute
   * @param {any} [options={}] An object of options. If not set, sensible defaults will be used.
   * @memberof Markov
   */
  constructor(data: string[] | Array<{ string: string }>, options: MarkovOptions = {}) {
    this._checkOptions(options, "constructor")

    // Format data if necessary
    if (_.isString(data[0])) {
      data = (data as string[]).map(s => ({ string: s }))
    } else if (!data[0].hasOwnProperty("string")) {
      throw new Error('Objects in your corpus must have a "string" property')
    }

    this.data = data as Array<{ string: string }>

    // Save options
    this.options = this.defaultOptions
    _.assignIn(this.options, options)
  }

  /**
   * Builds the corpus
   *
   * @returns {Promise<void>}
   * @memberof Markov
   */
  public buildCorpus(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve(this.buildCorpusSync())
    })
  }

  /**
   * Builds the corpus (synced method)
   *
   * @memberof Markov
   */
  public buildCorpusSync(): void {
    const options = this.options

    this.corpus = {}
    this.data.forEach(item => {
      const line = item.string
      const words = line.split(" ")
      const stateSize = options.stateSize!

      // Start words
      const start = _.slice(words, 0, stateSize).join(" ")
      const oldStartObj = this.startWords.find(o => o.words === start)
      if (oldStartObj) {
        if (!_.includes(oldStartObj.refs, item)) { oldStartObj.refs.push(item) }
      } else {
        this.startWords.push({ words: start, refs: [item] })
      }

      // End words
      const end = _.slice(words, words.length - stateSize, words.length).join(" ")
      const oldEndObj = this.endWords.find(o => o.words === end)
      if (oldEndObj) {
        if (!_.includes(oldEndObj.refs, item)) { oldEndObj.refs.push(item) }
      } else {
        this.endWords.push({ words: end, refs: [item] })
      }

      // Build corpus
      for (let i = 0; i < words.length - 1; i++) {
        const curr = _.slice(words, i, i + stateSize).join(" ")
        const next = _.slice(words, i + stateSize, i + stateSize * 2).join(" ")
        if (!next || next.split(" ").length !== options.stateSize) {
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
   * @param {MarkovOptions} options
   * @returns {Promise<MarkovResult>}
   * @memberof Markov
   */
  public generateSentence(options: MarkovOptions): Promise<MarkovResult> {
    this._checkOptions(options, "generateSentence")

    return new Promise((resolve, reject) => {
      try {
        const result = this.generateSentenceSync(options)
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Generates a result, that contains a string and its references (synced method)
   *
   * @param {MarkovOptions} [options={}]
   * @returns {MarkovResult}
   * @memberof Markov
   */
  public generateSentenceSync(options: MarkovOptions = {}): MarkovResult {
    if (!this.corpus) {
      throw new Error("Corpus is not built.")
    }

    this._checkOptions(options, "generateSentenceSync")

    const newOptions: MarkovOptions = {}
    _.assignIn(newOptions, this.options, options)
    options = newOptions

    const corpus = _.cloneDeep(this.corpus)
    const max = options.maxTries!

    // loop for maximum tries
    for (let i = 0; i < max; i++) {
      let ended = false
      const arr = [_.sample(this.startWords)]
      let score = 0

      // loop to build sentence
      let limit = 0
      while (limit < max) {
        const block = arr[arr.length - 1] // last value in array
        const state = _.sample(corpus[block.words])

        // sentence cannot be finished
        if (!state) {
          break
        }

        // add new state to list
        arr.push(state)

        // increment score
        score += corpus[block.words].length - 1 // increment score

        // is sentence finished?
        if (_.some(this.endWords, { words: state.words })) {
          ended = true
          break
        }
        limit++
      }
      const scorePerWord = Math.ceil(score / arr.length)

      const sentence = _.map(arr, "words").join(" ").trim()
      const result = {
        string: sentence,
        score,
        scorePerWord,
        refs: _.uniqBy(_.flatten(_.map(arr, "refs")), "string")
      }

      // sentence is not ended or incorrect
      if (!ended ||
        typeof options.checker === "function" && !options.checker(sentence) || // checker cb returns false
        typeof options.filter === "function" && !options.filter(result) ||
        options.minWords && options.minWords > 0 && sentence.split(" ").length < options.minWords ||
        options.maxWords && options.maxWords > 0 && sentence.split(" ").length > options.maxWords ||
        options.maxLength && options.maxLength > 0 && sentence.length > options.maxLength ||
        options.minScore && score < options.minScore ||
        options.minScorePerWord && scorePerWord < options.minScorePerWord
      ) {
        continue
      }

      return result
    }
    throw new Error("Cannot build sentence with current corpus and options")
  }

  private _checkOptions(options: MarkovOptions, methodName: string): void {
    if (options && typeof options.checker !== "undefined") {
      warn(
        `You've passed an 'options' object with 'checker' ` +
        `property set to 'MarkovGenerator.${methodName}'. ` +
        `'checker(sentence)' property is deprecated and will be removed ` +
        `in future versions of the library. ` +
        `Please use 'filter(result)' property instead.`
      )
    }
  }
}

export = Markov
