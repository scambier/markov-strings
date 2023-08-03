import {
  cloneDeep,
  flatten,
  includes,
  isEmpty,
  isString,
  slice,
  some,
  uniqBy,
} from 'lodash'
import assignIn from 'lodash/assignIn' // Workaround for weird issue with jest

export type MarkovInputData = { string: string }[]

export type MarkovGenerateOptions = {
  maxTries?: number
  prng?: () => number
  filter?: (result: MarkovResult) => boolean
}

/**
 * Data to build the Markov instance
 */
export type MarkovConstructorOptions = {
  stateSize?: number
}

/**
 * While `stateSize` is optional as a constructor parameter,
 * it must exist as a member
 */
export type MarkovDataMembers = {
  stateSize: number
}

export type MarkovResult = {
  string: string
  score: number
  refs: MarkovInputData
  tries: number
}

export type MarkovFragment = {
  words: string
  refs: MarkovInputData
}

export type Corpus = { [key: string]: MarkovFragment[] }

export type MarkovImportExport = {
  corpus: Corpus
  startWords: MarkovFragment[]
  endWords: MarkovFragment[]
  options: MarkovDataMembers
}

function sampleWithPRNG<T>(
  array: T[],
  prng: () => number = Math.random
): T | undefined {
  const length = array == null ? 0 : array.length
  return length ? array[Math.floor(prng() * length)] : undefined
}

export default class Markov {
  public data: MarkovInputData
  public options: MarkovDataMembers

  public startWords: MarkovFragment[] = []
  public endWords: MarkovFragment[] = []
  public corpus: Corpus = {}

  private defaultOptions: MarkovDataMembers = {
    stateSize: 2,
  }

  /**
   * Creates an instance of Markov generator.
   *
   * @param {MarkovConstructorOptions} [options={}]
   * @memberof Markov
   */
  constructor(options: MarkovConstructorOptions = {}) {
    this.data = []

    // Save options
    this.options = this.defaultOptions
    assignIn(this.options, options)
  }

  /**
   * Imports a corpus. This overwrites existing data.
   *
   * @param data
   */
  public import(data: MarkovImportExport): void {
    this.options = cloneDeep(data.options)
    this.corpus = cloneDeep(data.corpus)
    this.startWords = cloneDeep(data.startWords)
    this.endWords = cloneDeep(data.endWords)
  }

  /**
   * Exports structed data used to generate sentence.
   */
  public export(): MarkovImportExport {
    return cloneDeep({
      options: this.options,
      corpus: this.corpus,
      startWords: this.startWords,
      endWords: this.endWords,
    })
  }

  public addData(rawData: MarkovInputData | string[]) {
    // Format data if necessary
    let input: MarkovInputData = []
    if (isString(rawData[0])) {
      input = (rawData as string[]).map((s) => ({ string: s }))
    } else if (rawData[0].hasOwnProperty('string')) {
      input = rawData as MarkovInputData
    } else {
      throw new Error('Objects in your corpus must have a "string" property')
    }

    this.buildCorpus(input)

    this.data = this.data.concat(input)
  }

  /**
   * Builds the corpus. You must call this before generating sentences.
   *
   * @memberof Markov
   */
  private buildCorpus(data: MarkovInputData): void {
    const options = this.options

    // Loop through all sentences
    data.forEach((item) => {
      const line = item.string
      const words = line.split(' ')
      const stateSize = options.stateSize // Default value of 2 is set in the constructor

      //#region Start words
      // "Start words" is the list of words that can start a generated chain.

      const start = slice(words, 0, stateSize).join(' ')
      const oldStartObj = this.startWords.find((o) => o.words === start)

      // If we already have identical startWords
      if (oldStartObj) {
        // If the current item is not present in the references, add it
        if (!includes(oldStartObj.refs, item)) {
          oldStartObj.refs.push(item)
        }
      } else {
        // Add the startWords (and reference) to the list
        this.startWords.push({ words: start, refs: [item] })
      }

      //#endregion Start words

      //#region End words
      // "End words" is the list of words that can end a generated chain.

      const end = slice(words, words.length - stateSize, words.length).join(' ')
      const oldEndObj = this.endWords.find((o) => o.words === end)
      if (oldEndObj) {
        if (!includes(oldEndObj.refs, item)) {
          oldEndObj.refs.push(item)
        }
      } else {
        this.endWords.push({ words: end, refs: [item] })
      }

      //#endregion End words

      //#region Corpus generation

      // We loop through all words in the sentence to build "blocks" of `stateSize`
      // e.g. for a stateSize of 2, "lorem ipsum dolor sit amet" will have the following blocks:
      //    "lorem ipsum", "ipsum dolor", "dolor sit", and "sit amet"
      for (let i = 0; i < words.length - 1; i++) {
        const curr = slice(words, i, i + stateSize).join(' ')
        const next = slice(words, i + stateSize, i + stateSize * 2).join(' ')
        if (!next || next.split(' ').length !== options.stateSize) {
          continue
        }

        // Check if the corpus already has a corresponding "curr" block
        if (this.corpus.hasOwnProperty(curr)) {
          const oldObj = this.corpus[curr].find((o) => o.words === next)
          if (oldObj) {
            // If the corpus already has the chain "curr -> next",
            // just add the current reference for this block
            oldObj.refs.push(item)
          } else {
            // Add the new "next" block in the list of possible paths for "curr"
            this.corpus[curr].push({ words: next, refs: [item] })
          }
        } else {
          // Add the "curr" block and link it with the "next" one
          this.corpus[curr] = [{ words: next, refs: [item] }]
        }
      }

      //#endregion Corpus generation
    })
  }

  /**
   * Generates a result, that contains a string and its references
   *
   * @param {MarkovGenerateOptions} [options={}]
   * @returns {MarkovResult}
   * @memberof Markov
   */
  public generate(options: MarkovGenerateOptions = {}): MarkovResult {
    if (isEmpty(this.corpus)) {
      throw new Error(
        'Corpus is empty. There is either no data, or the data is not sufficient to create markov chains.'
      )
    }

    const corpus = cloneDeep(this.corpus)
    const maxTries = options.maxTries ? options.maxTries : 10
    const prng = options.prng ? options.prng : Math.random

    let tries: number

    // We loop through fragments to create a complete sentence
    for (tries = 1; tries <= maxTries; tries++) {
      let ended = false

      // Create an array of MarkovCorpusItems
      // The first item is a random startWords element
      const arr = [sampleWithPRNG(this.startWords, prng)!]

      let score = 0

      // loop to build a complete sentence
      for (let innerTries = 0; innerTries < maxTries; innerTries++) {
        const block = arr[arr.length - 1] // last value in array
        const state = sampleWithPRNG(corpus[block.words], prng) // Find a following item in the corpus

        // If a state cannot be found, the sentence can't be completed
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
      }

      const sentence = arr
        .map((o) => o.words)
        .join(' ')
        .trim()

      const result = {
        string: sentence,
        score,
        refs: uniqBy(flatten(arr.map((o) => o.refs)), 'string'),
        tries,
      }

      // sentence is not ended or incorrect
      if (
        !ended ||
        (typeof options.filter === 'function' && !options.filter(result))
      ) {
        continue
      }

      return result
    }
    throw new Error(
      `Failed to build a sentence after ${
        tries - 1
      } tries. Possible solutions: try a less restrictive filter(), give more raw data to the corpus builder, or increase the number of maximum tries.`
    )
  }
}
