import { map, some } from 'lodash-es'
import Markov, { MarkovResult } from '../src'
import { describe, expect,  it, beforeEach, vi } from 'vitest'

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

    it('should have a default stateSize', () => {
      const markov = new Markov()
      expect(markov.options.stateSize).toBe(2)
    })

    it('should save a different stateSize', () => {
      const markov = new Markov({ stateSize: 3 })
      expect(markov.options.stateSize).toBe(3)
    })
  })

  describe('Adding data', () => {
    it('should build synchronously', () => {
      const markov = new Markov()
      expect(markov.corpus).toEqual({})
      markov.addData(data)
      expect(markov.corpus).not.toEqual({})
    })


    it('should throw an error if the data structure is invalid', () => {
      const markov = new Markov()
      expect(() => {
        // @ts-ignore
        markov.addData([{}])
      }).toThrowError()
    })

    it('should accept objects', () => {
      const markov = new Markov()
      markov.addData(data.map(o => ({ string: o })))
      expect(markov.corpus).not.toEqual({})
    })

  })

  describe('After adding data', () => {
    let markov: Markov
    beforeEach(() => {
      markov = new Markov()
      markov.addData(data)
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

    describe('The corpus itself', () => {
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

    describe('Export data', () => {
      it('should clone the original corpus values', () => {
        const exported = markov.export()

        expect(exported.corpus).toEqual(markov.corpus)
        expect(exported.corpus).not.toBe(markov.corpus)

        expect(exported.startWords).not.toBe(markov.startWords)
        expect(exported.startWords).toEqual(markov.startWords)

        expect(exported.endWords).not.toBe(markov.endWords)
        expect(exported.endWords).toEqual(markov.endWords)

        expect(exported.options).toEqual(markov.options)
        expect(exported.options).not.toBe(markov.options)
      })
    })

    describe('Import data', () => {
      it('should overwrite original values', () => {
        const exported = markov.export()
        const newMarkov = new Markov()

        // Make sure that the corpus is empty
        expect(newMarkov.corpus).toEqual({})

        newMarkov.import(exported)

        expect(newMarkov.corpus).toEqual(exported.corpus)
        expect(newMarkov.corpus).not.toBe(exported.corpus)

        expect(newMarkov.startWords).toEqual(exported.startWords)
        expect(newMarkov.startWords).not.toBe(exported.startWords)

        expect(newMarkov.endWords).toEqual(exported.endWords)
        expect(newMarkov.endWords).not.toBe(exported.endWords)

        expect(newMarkov.options).toEqual(exported.options)
        expect(newMarkov.options).not.toBe(exported.options)
      })
    })
  })

  describe('The sentence generator', () => {
    let markov: Markov
    beforeEach(() => {
      markov = new Markov()
      markov.addData(data)
    })

    it('should throw an error if the corpus is not built', () => {
      markov = new Markov()
      expect(() => {
        markov.generate()
      }).toThrowError('Corpus is empty. There is either no data, or the data is not sufficient to create markov chains.')
    })

    it('should return a result if under the tries limit', () => {
      expect.assertions(10)

      for (let i = 0; i < 10; i++) {
        const sentence = markov.generate({ maxTries: 20 })
        expect(sentence.tries).toBeLessThanOrEqual(20)
      }
    })

    it('should call the `filter` callback', () => {
      const filter = vi.fn(x => true)
      markov.generate({ filter })
      expect(filter).toHaveBeenCalled()
    })

    it('should throw an error after 10 tries, by default', () => {
      expect(() => {
        markov.generate({
          filter(result: MarkovResult): boolean {
            return false
          }
        })
      }).toThrowError('10')
    })

    it('should end with a value from endWords', async () => {
      expect.assertions(10)

      for (let i = 0; i < 10; i++) {
        const result = markov.generate()
        const arr = result.string.split(' ')
        const end = arr.slice(arr.length - 2, arr.length)
        expect(map(markov.endWords, 'words')).toContain(end.join(' '))
      }
    })

    it(`should pass the result object to 'filter(result)'`, async () => {
      expect.assertions(6)

      const options = {
        minWords: 5,
        maxTries: 10,
        filter: (result: MarkovResult): boolean => {
          expect(Object.keys(result)).toHaveLength(4)
          expect(result).toHaveProperty('string')
          expect(result).toHaveProperty('score')
          expect(result).toHaveProperty('refs')
          expect(Array.isArray(result.refs)).toBeTruthy()
          expect(result).toHaveProperty('tries')
          return true
        }
      }
      markov.generate(options)
    })

  })
})
