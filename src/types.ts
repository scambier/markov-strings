
export type MarkovGenerateOptions = {
  maxLength?: number
  minWords?: number
  maxWords?: number
  minScore?: number
  minScorePerWord?: number
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
  refs: Array<{ string: string }>
}

export type MarkovCorpusItem = {
  words: any
  refs: Array<{ string: string }>
}
