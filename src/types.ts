
export type MarkovGenerateOptions = {
  maxTries?: number
  filter?: (result: MarkovResult) => boolean
}

export type MarkovConstructorOptions = {
  stateSize?: number
}

export type MarkovResult = {
  string: string,
  score: number,
  scorePerWord: number,
  refs: Array<{ string: string }>,
  tries: number
}

export type MarkovFragment = {
  words: string
  refs: Array<{ string: string }>
}

export type Corpus = { [key: string]: MarkovFragment[] }
