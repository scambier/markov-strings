
export type MarkovOptions = {
  stateSize?: number
  maxLength?: number
  minWords?: number
  maxWords?: number
  minScore?: number
  minScorePerWord?: number
  maxTries?: number
  checker?: (result: string) => boolean
  filter?: (result: MarkovResult) => boolean
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
