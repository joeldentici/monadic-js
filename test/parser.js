const λ = require('fantasy-check/src/adapters/nodeunit');

const {equals} = require('../test-lib.js');
const {identity, constant} = require('fantasy-combinators');

const P = require('../src/parser');
const Either = require('../src/either');

function eq(test) {
	return function(a, b) {
		test.equals(equals(a, b), true);
	}
}

function result(parse) {
	return x => parse(x).case({
		Right: ({val}) => Either.of(val),
		Left: ({err}) => Either.Left(err)
	});
}

exports.Parser = {
	'left-recursion': test => {
		const res = x => y => [x, y];
		const res2 = x => y => z => [x,y,z];

		const parser = P.recursive(() =>
		  P.of(res).app(parser).app(parser)
		   .alt(a)
		).memoize();

		const parser2 = P.recursive(() =>
		  P.of(res2).app(parser2).app(parser2).app(parser2)
		   .alt(a)
		).memoize(false);

		const a = P.term('a');

		const parse = result(P.runParser(parser));
		const parse2 = result(P.runParser(parser2));

		const _ = eq(test);

		_(parse('aa'), Either.of(['a','a']));
		_(parse2('aaa'), Either.of(['a','a','a']));

		test.done();
	},
	'chain-failing': test => {
		const parser = P.of('a').chain(_ => P.fail('e'));

		const parse = result(P.runParser(parser));

		const _ = eq(test);

		_(parse('a'), Either.Left('e'));

		test.done();
	},
	'fallback-test': test => {
		const parser = P.fail('e').fallback('a');
		const parser2 = P.of('b').fallback('a');

		const parse = result(P.runParser(parser));
		const parse2 = result(P.runParser(parser2));

		const _ = eq(test);

		_(parse(''), Either.of('a'));
		_(parse2(''), Either.of('b'));

		test.done();
	},
	'alternative/monadplus annihilation': test => {
		const parser = P.zero().chain(_ => P.of('a'));
		const parse = result(P.runParser(parser));
		const zero = result(P.runParser(P.zero()));

		const _ = eq(test);

		_(parse(''), zero(''));

		test.done();
	},
	'all': test => {
		const parser = P.all;
		const parse = result(P.runParser(parser));

		const _ = eq(test);

		_(parse('abcde'), Either.of('abcde'));

		test.done();
	},
	'any': test => {
		const parser = P.any;
		const parse = result(P.runParser(parser));

		const _ = eq(test);

		_(parse('a'), Either.of('a'));
		_(parse('b'), Either.of('b'));
		_(parse(''), Either.Left(new P.ExpectedError('any input')));

		test.done();
	},
	'lookahead': test => {
		const p = P.term('a');
		const parser = P.lookahead(p);

		const parse = result(P.runParser(parser, false));

		const _ = eq(test);

		_(parse('a'), Either.of(true));
		_(parse('b'), Either.of(false));

		test.done();
	},
	'regex': test => {
		const p = P.regex(/a/)('an a');
		const parse = result(P.runParser(p, false));

		const _ = eq(test);

		_(parse('bbbakkk'), Either.of('bbbakkk'.match(/a/)));
		_(parse('bbbbb'), Either.Left(new P.ExpectedError('an a')));

		test.done();
	},
	'eof': test => {
		const p = P.eof;
		const parse = result(P.runParser(p));

		const _ = eq(test);

		_(parse('a'), Either.Left(new P.ExpectedError('EOF')));

		test.done();
	},
	'findToken': test => {
		const parser = P.findToken(t => t === 'a')('an a');
		const parse = result(P.runParser(parser));

		const _ = eq(test);

		_(parse(['b','b','b','a']), Either.of('a'));
		_(parse(['b','b','b','b']), Either.Left(new P.ExpectedError('an a')));

		test.done();
	},
	'show': test => {
		//TODO: Replace this with an actual test once i've bothered to make
		//show actually useful

		P.showError({
			err: new P.ExpectedError('an a'),
			pos: 0
		})([]);

		P.showError({
			err: new P.ExpectedError([new P.ExpectedError('an a'), new P.ExpectedError('a b')]),
			pos: 0,
		})([]);

		P.showError({
			err: new Error("a"),
			pos: 0,
		})([]);

		test.done();
	}
};
/*
const P = require('./index.js');

function processEscapes(str) {
  let escapes = {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  };
  return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
    let type = escape.charAt(0);
    let hex = escape.slice(1);
    if (type === 'u') {
      return String.fromCharCode(parseInt(hex, 16));
    }
    if (escapes.hasOwnProperty(type)) {
      return escapes[type];
    }
    return type;
  });
}

const ws = P.regex(/^\s*//*)('whitespace');

const token = parser => parser.seqL(ws);

const word = str => ws.seqR(P.term(str)).seqL(ws);

const number = token(P.regex(/^-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/)('number')).map(x => Number(x[0]));

const string = token(P.regex(/^"((?:\\.|.)*?)"/)('string')).map(x => x[1].toString()).map(processEscapes);

const _true = word('true').map(_ => true);
const _null = word('null').map(_ => null);
const _false = word('false').map(_ => false);

const lbrace = word('{');
const rbrace = word('}');
const lbracket = word('[');
const rbracket = word(']');
const comma = word(',');
const colon = word(':');


const array = P.recursive(() =>
	expr.sepBy(comma).wrap(lbracket, rbracket)
);

const Pair = l => r => [l, r];
const pair = P.recursive(() =>
	P.of(Pair)
	.app(string)
	.skip(colon)
	.app(expr)
);

const object = P.recursive(() =>
	pair.sepBy(comma)
	.map(pairs => pairs.reduce((acc, pair) => {
			acc[pair[0]] = pair[1];
			return acc;
	}, {}))
	.wrap(lbrace, rbrace)
);

const expr = object.or(array).or(number).or(_null).or(string).or(_true).or(_false);

const jsonParse = P.runParser(expr);

let text = `\
{
  "id": "a thing\\nice\tab",
  "another property!"
    : "also cool"
  , "weird formatting is ok too........😂": 123.45e1,
  "": [
    true, false, null,
    "",
    " ",
    {},
    {"": {}}
  ]
}
`;

let aaa = '{"a": ["888", 5, 6, null, "a"], "b": 10 }';

jsonParse(text).case({
	Right: ({val}) => console.log(val),
	Left: ({err}) => console.error(err),
});

*/