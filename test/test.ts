import { some } from 'lodash'
import Markov from '../src/markov'

const data = [
  'Lorem ipsum dolor sit amet',
  'Lorem ipsum duplicate start words',
  'Consectetur adipiscing elit',
  'Quisque tempor, erat vel lacinia imperdiet',
  'Justo nisi fringilla dui',
  'Egestas bibendum eros nisi ut lacus',
  'fringilla dui avait annoncé une rupture avec le erat vel: il n\'en est rien…',
  'Fusce tincidunt tempor, erat vel lacinia vel ex pharetra pretium lacinia imperdiet'
]

describe('Markov class', () => {

  let markov: Markov
  beforeEach(() => {
    markov = new Markov(data)
    markov.buildCorpus()
  })

  describe('Constructor', () => {
    it('should throw an error if corpus is invalid', () => {
      expect(() => {
        // @ts-ignore
        markov = new Markov([{}])
      }).toThrowError()
    })

    it('should have a default stateSize', () => {
      markov = new Markov(data)
      expect(markov.options.stateSize).toBe(2)
    })

    it('should save a different stateSize', () => {
      markov = new Markov(data, { stateSize: 3 })
      expect(markov.options.stateSize).toBe(3)
    })
  })

  describe('After building the corpus', () => {
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
    it('should have the right values for the right keys', () => {
      const corpus = markov.corpus
      expect(some(corpus['Lorem ipsum'], { words: 'dolor sit' })).toBeTruthy()
      expect(some(corpus['Lorem ipsum'], { words: 'duplicate start' })).toBeTruthy()
      expect(some(corpus['tempor, erat'], { words: 'vel lacinia' })).toBeTruthy()
    })
  })

  describe('generateSentence', () => {})
})
