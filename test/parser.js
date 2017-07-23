
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

const ws = P.regex(/^\s*/)/*('whitespace');

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