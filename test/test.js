'use strict';

var expect = require('chai').expect;

var Generator = require('../index');

var data = [
  "Lorem ipsum dolor sit amet",
  "Lorem ipsum duplicate start words",
  "Consectetur adipiscing elit",
  "Quisque tempor, erat vel lacinia imperdiet",
  "Justo nisi fringilla dui",
  "Egestas bibendum eros nisi ut lacus",
  "fringilla dui avait annoncé une rupture avec le erat vel: il n'en est rien…",
  "Fusce tincidunt tempor, erat vel lacinia vel ex pharetra pretium lacinia imperdiet"
];

describe('Options parser', function() {
  it('should have the right values', function() {
    var generator = new Generator([], {});
    expect(generator.options.stateSize).to.equal(2);
  });
});

describe('Generator builder', function() {

  var generator;
  before(function() {
    generator = new Generator(data)
  });

  describe('StartWords array', function() {
    it('should contain the right values', function() {
      var start = generator.startWords;
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
      var end = generator.endWords;
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
      var corpus = generator.corpus;
      expect(corpus['Lorem ipsum']).to.contain('dolor sit');
      expect(corpus['Lorem ipsum']).to.contain('duplicate start');
      expect(corpus['tempor, erat']).to.contain('vel lacinia');
    });
  });
});

describe('Sentence generator', function() {

  var generator;
  before(function() {
    generator = new Generator(data)
  });

  it('should output a sentence', function() {
    let result = generator.generateSentence({
      stateSize: 1
    });
    expect(result).to.exist;
  });

  it('should throw an error when a sentence cannot be built', function() {
    for (let i = 0; i < 10; i++) {
      expect(() => {
        generator.generateSentence({
          stateSize: 3
        }).to.throw(Error);
      })
    }
  });

  it('should end with a value from endWords', function() {
    let result = generator.generateSentence().string;
    let arr = result.split(' ');
    let end = arr.slice(arr.length - 2, arr.length);

    for (let i = 0; i < 10; i++) {
      expect(generator.endWords).to.contain(end.join(' '));
    }
  });

  it('should reject the sentence', function() {
    let options = {minWords: 5, maxTries: 10};
    expect(() => {
      generator.generateSentence(options, result => result.split(' ').length < 5)
    }).to.throw(Error);
  });

  it('should accept the sentence', function() {
    expect(() => {
      generator.generateSentence({}, result => true)
    }).to.exist;
  });

  it('should reject because maxLength is unattainable', function() {
    expect(() => {
      generator.generateSentence({maxTries: 10, maxLength: 1, minWords: 0, maxWords: 0})
    }).to.throw(Error);
  });

  it('should reject because minWords is unattainable', function() {
    expect(() => {
      generator.generateSentence({maxTries: 10, minWords: 100})
    }).to.throw(Error);
  });

  it('should reject because minScore is unattainable', function() {
    expect(() => {
      generator.generateSentence({maxTries: 10, minScore: 20})
    }).to.throw(Error);
  });

  it('should reject because maxWords is unattainable', function() {
    expect(() => {
      generator.generateSentence({maxTries: 10, maxWords: 1, minWords: 0})
    }).to.throw(Error);
  });

});
