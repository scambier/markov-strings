# Changelog

## 3.0.0 - BREAKING CHANGES

- Refactoring to facilitate iterative construction of the corpus (multiple `.addData()` instead of a one-time `buildCorpus()`), and export/import of corpus internal data.

## 2.1.0

- Add an optionnal `prng` parameter at generation to use a specific Pseudo Random Number Generator

## 2.0.4

- Dependencies update

## 2.0.0

- **Refactoring with breaking changes**
- The constructor and generator take two different options objects
- Most of generator options are gone, except `filter` and `maxTries`
- Tests have been rewritten with jest, in TypeScript

## 1.5.0

- Code rewritten in TypeScript. You can now `import MarkovGenerator from 'markov-strings'`

## 1.4.0

- New `filter()` method, thanks @flpvsk

## 1.3.4 - 1.3.5

- Dependencies update

## 1.3.3

- Updated README. Version bump for npm

## 1.3.2

- Fixed an infinite loop bug
- Performance improvement

## 1.3.1

- Updated README example
- Removed a useless line

## 1.3.0

- New feature: the generator now accepts arrays of objects, and tells the user which objects were used to build a sentence
- Fixed all unit tests
- Added a changelog
