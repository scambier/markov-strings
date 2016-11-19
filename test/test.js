'use strict';

const expect = require('chai').expect,
  _ = require('lodash');

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

const Generator = require('../index');
const generator = new Generator(data);

beforeEach(function (done) {
  generator.buildCorpus().then(done);
});

describe('Options parser', function () {
  it('should have the right values', function () {
    expect(generator.options.stateSize).to.equal(2);
  });
});

describe('In buildCorpus', function () {

  describe('StartWords array', function () {
    it('should contain the right values', function () {
      const start = generator.startWords;
      expect(_.some(start, { words: 'Lorem ipsum' })).to.be.true;
      expect(_.some(start, { words: 'Consectetur adipiscing' })).to.be.true;
      expect(_.some(start, { words: 'Quisque tempor,' })).to.be.true;
      expect(_.some(start, { words: 'Justo nisi' })).to.be.true;
      expect(_.some(start, { words: 'Egestas bibendum' })).to.be.true;
      expect(_.some(start, { words: 'fringilla dui' })).to.be.true;
      expect(_.some(start, { words: 'Fusce tincidunt' })).to.be.true;
    });

    it('should have the right length', function () {
      expect(generator.startWords).to.have.lengthOf(7);
    });
  });

  describe('EndWords array', function () {
    it('should have the right length', function () {
      expect(generator.endWords).to.have.lengthOf(7);
    });

    it('should contain the right values', function () {
      const end = generator.endWords;
      expect(_.some(end, { words: 'sit amet' })).to.be.true;
      expect(_.some(end, { words: 'start words' })).to.be.true;
      expect(_.some(end, { words: 'adipiscing elit' })).to.be.true;
      expect(_.some(end, { words: 'fringilla dui' })).to.be.true;
      expect(_.some(end, { words: 'ut lacus' })).to.be.true;
      expect(_.some(end, { words: 'est rien…' })).to.be.true;
    });
  });

  describe('Corpus', function () {
    it('should have the right values for the right keys', function () {
      const corpus = generator.corpus;
      expect(_.some(corpus['Lorem ipsum'], { words: 'dolor sit' })).to.be.true;
      expect(_.some(corpus['Lorem ipsum'], { words: 'duplicate start' })).to.be.true;
      expect(_.some(corpus['tempor, erat'], { words: 'vel lacinia' })).to.be.true;
    });
  });

  describe('Options', function () {
    it('should take given options into account', function () {
      const generator = new Generator(['lorem'], { maxTries: 2 });
      expect(generator.options.maxTries).to.equal(2);
    })
  })
});

describe('Sentence generator', function () {

  it('should throw an error if corpus is not built', function () {
    const generator = new Generator(data);
    expect(() => {
      generator.generateSentenceSync()
    }).to.throw(Error);
  });

  it('should output a sentence', function (done) {
    generator.generateSentence({ stateSize: 1 })
      .then(result => {
        expect(result).to.exist;
        done();
      });
  });

  it('should end with a value from endWords', function (done) {
    for (let i = 0; i < 10; i++) {
      generator.generateSentence()
        .then(result => {
          const arr = result.string.split(' ');
          const end = arr.slice(arr.length - 2, arr.length);
          expect(_.map(generator.endWords, 'words')).to.contain(end.join(' '));
          if (i === 9) {
            done();
          }
        });
    }
  });

  it('should reject the sentence', function (done) {
    const options = {
      minWords: 5,
      maxTries: 10,
      checker: result => result.string.split(' ').length < 5
    };
    generator.generateSentence(options)
      .catch(e => {
        expect(e).to.be.an('error');
        done();
      })
  });

  it('should reject because maxLength is unattainable', function (done) {
    generator.generateSentence({ maxTries: 100, maxLength: 1, minWords: 0, maxWords: 0 })
      .catch(e => {
        expect(e).to.be.an('error');
        done();
      });
  });

  it('should reject because minWords is unattainable', function (done) {
    generator.generateSentence({ maxTries: 100, minWords: 100 })
      .catch(e => {
        expect(e).to.be.an('error');
        done();
      });
  });

  it('should reject because minScore is unattainable', function (done) {
    generator.generateSentence({ maxTries: 100, minScore: 20 })
      .catch(e => {
        expect(e).to.be.an('error');
        done();
      });
  });

  it('should reject because maxWords is unattainable', function (done) {
    generator.generateSentence({ maxTries: 100, maxWords: 1, minWords: 0 })
      .catch(e => {
        expect(e).to.be.an('error');
        done();
      });
  });

  it('should reject all sentences because of the callback', function (done) {
    generator.generateSentence({
        maxTries: 100,
        checker: result => false
      })
      .catch(e => {
        expect(e).to.be.an('error');
        done();
      });
  });

  it('should accept all sentences because of the callback', function (done) {
    generator.generateSentence({
        checker: result => true
      })
      .then(result => {
        expect(result).to.exist;
        done();
      });
  });

  it('should return an object with all attributes', function (done) {
    generator.generateSentence({
        checker: result => true
      })
      .then(result => {
        expect(result.string).to.exist;
        expect(result.score).to.exist;
        expect(result.scorePerWord).to.exist;
        expect(result.refs).to.exist;
        done();
      });
  });

});
