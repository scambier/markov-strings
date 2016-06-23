'use strict';

const expect = require('chai').expect;

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

beforeEach(function(done) {
  generator.buildCorpus().then(done);
});

describe('Options parser', function() {
  it('should have the right values', function() {
    expect(generator.options.stateSize).to.equal(2);
  });
});

describe('Generator builder', function() {

  describe('StartWords array', function() {
    it('should contain the right values', function() {
      const start = generator.startWords;
      expect(start).to.contain('Lorem ipsum');
      expect(start).to.contain('Consectetur adipiscing');
      expect(start).to.contain('Quisque tempor,');
      expect(start).to.contain('Justo nisi');
      expect(start).to.contain('Egestas bibendum');
    });

    it('should have the right length', function() {
      expect(generator.startWords).to.have.lengthOf(7);
    });
  });

  describe('EndWords array', function() {
    it('should have the right length', function() {
      expect(generator.endWords).to.have.lengthOf(7);
    });

    it('should contain the right values', function() {
      const end = generator.endWords;
      expect(end).to.contain('sit amet');
      expect(end).to.contain('start words');
      expect(end).to.contain('adipiscing elit');
      expect(end).to.contain('fringilla dui');
      expect(end).to.contain('ut lacus');
      expect(end).to.contain('est rien…');
    });
  });

  describe('Corpus', function() {
    it('should have the right values for the right keys', function() {
      const corpus = generator.corpus;
      expect(corpus['Lorem ipsum']).to.contain('dolor sit');
      expect(corpus['Lorem ipsum']).to.contain('duplicate start');
      expect(corpus['tempor, erat']).to.contain('vel lacinia');
    });
  });

  describe('Options', function() {
    it('should take given options into account', function() {
      const generator = new Generator([], {maxTries: 2});
      expect(generator.options.maxTries).to.equal(2);
    })
  })
});

describe('Sentence generator', function() {

  it('should throw an error if corpus is not built', function() {
    const generator = new Generator(data);
    expect(() => {
      generator.generateSentenceSync()
    }).to.throw(Error);
  });

  it('should output a sentence', function() {
    generator.generateSentence({stateSize: 1})
      .then(result => {
        expect(result).to.exist;
      });
  });

  it('should throw an error when a sentence cannot be built', function() {
    for (let i = 0; i < 10; i++) {
      generator.generateSentence({stateSize: 3})
        .then(result => {
          expect(result).to.throw(Error);
        });
    }
  });

  it('should end with a value from endWords', function() {
    for (let i = 0; i < 10; i++) {
      generator.generateSentence()
        .then(result => {
          const arr = result.split(' ');
          const end = arr.slice(arr.length - 2, arr.length);
          expect(generator.endWords).to.contain(end.join(' '));
        });
    }
  });

  it('should reject the sentence', function() {
    const options = {minWords: 5, maxTries: 10};
    generator.generateSentence(options, result => result.split(' ').length < 5)
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should accept the sentence', function() {
    generator.generateSentence({}, result => true)
      .then(result => {
        expect(result).to.exist;
      });
  });

  it('should reject because maxLength is unattainable', function() {
    generator.generateSentence({maxTries: 100, maxLength: 1, minWords: 0, maxWords: 0})
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject because minWords is unattainable', function() {
    generator.generateSentence({maxTries: 100, minWords: 100})
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject because minScore is unattainable', function() {
    generator.generateSentence({maxTries: 100, minScore: 20})
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject because maxWords is unattainable', function() {
    generator.generateSentence({maxTries: 100, maxWords: 1, minWords: 0})
      .then(result => {
        expect(result).to.throw(Error);
      });
  });

  it('should reject all sentences because of the callback', function() {
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

  it('should accept all sentences because of the callback', function() {
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
