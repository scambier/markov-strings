import { some } from 'lodash'
import Markov from '../src/markov'
import { MarkovResult } from '../src/types'

const data = [
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum duplicate start words',
  'Consectetur adipiscing elit',
  'Quisque tempor, erat vel lacinia imperdiet',
  'Justo nisi fringilla dui',
  'Egestas bibendum eros nisi ut lacus',
  "fringilla dui avait annoncé une rupture avec le erat vel: il n'en est rien…",
  'Fusce tincidunt tempor, erat vel lacinia vel ex pharetra pretium lacinia imperdiet'
]

describe('Markov class', () => {
  describe('Constructor', () => {
    it('should throw an error if corpus is invalid', () => {
      expect(() => {
        // @ts-ignore
        const markov = new Markov([{}])
      }).toThrowError()
    })

    it('should have a default stateSize', () => {
      const markov = new Markov(data)
      expect(markov.options.stateSize).toBe(2)
    })

    it('should save a different stateSize', () => {
      const markov = new Markov(data, { stateSize: 3 })
      expect(markov.options.stateSize).toBe(3)
    })
  })

  describe('Build the corpus', () => {
    it('should build synchronously', () => {
      const markov = new Markov(data)
      expect(markov.corpus).toEqual({})
      markov.buildCorpus()
      expect(markov.corpus).not.toEqual({})
    })

    it('should build asynchronously', async () => {
      expect.assertions(2)
      const markov = new Markov(data)
      expect(markov.corpus).toEqual({})
      await markov.buildCorpusAsync()
      expect(markov.corpus).not.toEqual({})
    })
  })

  describe('After building the corpus', () => {
    let markov: Markov
    beforeEach(() => {
      markov = new Markov(data)
      markov.buildCorpus()
    })

    describe('The startWords array', () => {
      it('should contain the right values', () => {
        const start = markov.startWords
        expect(some(start, { words: 'Lorem ipsum' })).toBeTruthy()
        expect(some(start, { words: 'Consectetur adipiscing' })).toBeTruthy()
        expect(some(start, { words: 'Quisque tempor,' })).toBeTruthy()
        expect(some(start, { words: 'Justo nisi' })).toBeTruthy()
        expect(some(start, { words: 'Egestas bibendum' })).toBeTruthy()
        expect(some(start, { words: 'fringilla dui' })).toBeTruthy()
        expect(some(start, { words: 'Fusce tincidunt' })).toBeTruthy()
      })

      it('should have the right length', () => {
        expect(markov.startWords).toHaveLength(7)
      })
    })

    describe('The endWords array', () => {
      it('should have the right length', () => {
        expect(markov.endWords).toHaveLength(7)
      })

      it('should contain the right values', () => {
        const end = markov.endWords
        expect(some(end, { words: 'sit amet' })).toBeTruthy()
        expect(some(end, { words: 'start words' })).toBeTruthy()
        expect(some(end, { words: 'adipiscing elit' })).toBeTruthy()
        expect(some(end, { words: 'fringilla dui' })).toBeTruthy()
        expect(some(end, { words: 'ut lacus' })).toBeTruthy()
        expect(some(end, { words: 'est rien…' })).toBeTruthy()
      })
    })
  })

  describe('The corpus itself', () => {
    let markov: Markov
    beforeEach(() => {
      markov = new Markov(data)
      markov.buildCorpus()
    })

    it('should have the right values for the right keys', () => {
      const corpus = markov.corpus
      expect(some(corpus['Lorem ipsum'], { words: 'dolor sit' })).toBeTruthy()
      expect(
        some(corpus['Lorem ipsum'], { words: 'duplicate start' })
      ).toBeTruthy()
      expect(
        some(corpus['tempor, erat'], { words: 'vel lacinia' })
      ).toBeTruthy()
    })
  })

  describe('The sentence generation', () => {
    let markov: Markov
    beforeEach(() => {
      markov = new Markov(data)
      markov.buildCorpus()
    })

    it('should throw an error if the corpus is not built', () => {
      markov = new Markov(data)
      expect(() => {
        markov.generateSentence()
      }).toThrowError('Corpus is not built')
    })

    it('should return a result if under the tries limit', () => {
      const sentence = markov.generateSentence({maxTries: 5})
      expect(sentence.tries).toBeLessThanOrEqual(5)
    })

    it('should throw an error after 10 tries, by default', () => {
      expect(() => {
        markov.generateSentence({
          filter(result: MarkovResult): boolean {
            return false
          }
        })
      }).toThrowError('10')
    })

    it('should generate asynchronously', async () => {
      markov.generateSentence = jest.fn()
      await markov.generateSentenceAsync()
      expect(markov.generateSentence).toHaveBeenCalled()
    })
  })
})
