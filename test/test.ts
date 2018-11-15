import Markov from '../src/markov'

const data = [
  "Lorem ipsum dolor sit amet",
  "Lorem ipsum duplicate start words",
  "Consectetur adipiscing elit",
  "Quisque tempor, erat vel lacinia imperdiet",
  "Justo nisi fringilla dui",
  "Egestas bibendum eros nisi ut lacus",
  "fringilla dui avait annoncé une rupture avec le erat vel: il n'en est rien…",
  "Fusce tincidunt tempor, erat vel lacinia vel ex pharetra pretium lacinia imperdiet"
];

describe('Markov class', () => {
  describe('constructor', () => {
    it('should have a default stateSize', () => {
      const markov = new Markov(data)
      expect(markov.options.stateSize).toBe(2)
    })

    it('should save a different stateSize', () => {
      const markov = new Markov(data, {stateSize: 3})
      expect(markov.options.stateSize).toBe(3)
    })
  })

  describe('buildCorpus', () => {

  })
})
