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

describe('In buildCorpus,', function () {

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
      const generator = new Generator([], { maxTries: 2 });
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

  it('should output a sentence', function () {
    generator.generateSentence({ stateSize: 1 })
      .then(result => {
        expect(result).to.exist;
      });
  });

  it('should throw an error when a sentence cannot be built', function () {
    for (let i = 0; i < 10; i++) {
      generator.generateSentence({ stateSize: 3 })
        .then(result => {
          expect(result).to.throw(Error);
        });
    }
  });

  it('should end with a value from endWords', function () {
    for (let i = 0; i < 10; i++) {
      generator.generateSentence()
        .then(result => {
          const arr = result.split(' ');
          const end = arr.slice(arr.length - 2, arr.length);
          expect(generator.endWords).to.contain(end.join(' '));
        });
    }
  });

  it('should reject the sentence', function () {
    const options = { minWords: 5, maxTries: 10 };
    generator.generateSentence(options, result => result.split(' ').length < 5)
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should accept the sentence', function () {
    generator.generateSentence({}, result => true)
      .then(result => {
        expect(result).to.exist;
      });
  });

  it('should reject because maxLength is unattainable', function () {
    generator.generateSentence({ maxTries: 100, maxLength: 1, minWords: 0, maxWords: 0 })
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject because minWords is unattainable', function () {
    generator.generateSentence({ maxTries: 100, minWords: 100 })
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject because minScore is unattainable', function () {
    generator.generateSentence({ maxTries: 100, minScore: 20 })
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject because maxWords is unattainable', function () {
    generator.generateSentence({ maxTries: 100, maxWords: 1, minWords: 0 })
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject all sentences because of the callback', function () {
    generator.generateSentence({
        maxTries: 100,
        callback: sentence => {
          return false;
        }
      })
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should accept all sentences because of the callback', function () {
    generator.generateSentence({
        callback: sentence => {
          return true;
        }
      })
      .then(result => {
        expect(result).to.exist;
      });
  });

});
