const transformDo = require('./transformjs.js');
const Module = require('module');
const fs = require('fs');


/**
 *	MonadicJS.do
 *	written by Joel Dentici
 *	on 6/30/2017
 *
 *	Provides ability to use do notation without
 *	relying on generators. This leads to fancier
 *	code and the ability to use monads that apply
 *	their bound function more than once, like list.
 *
 *	This module provides a function that can be called
 *	to install a hook into the node module loader, which
 *	will cause any later require() calls to have their
 *	module's source processed through this module. The
 *	transforming function itself is exported so you can
 *	write a simple source-to-source compiler if you prefer that.
 */



module.exports = function() {
	console.log('Loading do notation and expression extensions...');

	Module._extensions['.js'] = function(module, filename) {
		const source = fs.readFileSync(filename, 'utf8');

		const output = transformDo(source);

		output.case({
			Right: code => module._compile(code, filename),
			Left: err => {
				console.error('Could not process ' + filename);
				console.error(err);
				process.exit();
			}
		});
	}

	console.log('Loaded do notation and expression extensions!');
}






function test() {

const Lexer = require('./lexer.js');
const [lexicalGrammar, mappers] = require('./lexical-grammar.js');
const {expr} = require('./parsedo.js');
const P = require('../parser');
const transform = require('./transformdo.js');
const generate = require('./generatedo.js');

const lexer = new Lexer(lexicalGrammar, mappers);


function lex(input) {
	return lexer.lex(input);
}

function tester(parse) {
	return function(input) {
		const tokens = lex(input);
		const startTime = Date.now() / 1000;
		const ast = parse(tokens);
		const endTime = Date.now() / 1000;

		const elapsed = (endTime - startTime).toFixed(5);
		return ast.case({
			Right: ({val}) => JSON.stringify(val, null, 2),
			Left: err => P.showError(err)(tokens),
		}) + ', Elapsed: ' + elapsed;
	}
}

const parse = P.runParser(expr.map(e => generate(transform(e))), false);
const testParse = tester(parse);
const testParse2 = tester(P.runParser(expr, false));
/*
console.log(testParse('5'));

const array = '[5, "hello", 6, boob]';
console.log(testParse(array));

const object = '{ a : "hello", "b0": "hello", "d0": d88, abc }';
console.log(testParse(object));


const deleteT = 'delete 99';
console.log(testParse(deleteT));

/*
const compT = '5 < a != 7 < 10 + 4';
console.log(testParse(compT));
console.log(doParser.expressionDepth);

const fn = 'abc("def", {a: 0x5}, ["a", "b", 3, ["9"]])("elephant")';
console.log(testParse(fn));

const res = "abc.def.ghi";
console.log(testParse(res));
const res2 = "[abc] [def] . ghi . lmfao + 7 [xdf]";
console.log(testParse(res2));
*/
/*
const res3 = "x => y => [x, y]";
console.log(testParse(res3));

const res4 = "(x, y) => [x, y]";
console.log(testParse(res4));

const res5 = "([a,b],{x, d: y, '55': abc}) => [a,b,x,y,abc]";
console.log(testParse(res5));
*/
//console.log(testParse('(a => delete 10)'));
/*
console.log(testParse('[a,1][a]'));
//console.log(testParse('[1,2,3][5][6]'));
//console.log(testParse('a[c][d]'));

//console.log(testParse('a[a]'));

const startTime = Date.now() / 1000;
//testParse('abc.edf');
const endTime = Date.now() / 1000;
console.log(testParse('(abc[[edf,ghi].iii]).ghi'));

console.log(testParse('(b, {a,c}) => {a,b,c}["a"]'));

console.log(testParse('delete a["b"]'));*/
/*

const testParseDo = tester(parseDo);

console.log(testParseDo(`do Async {
	a <- x
	b <- y
	do! x
	m <- [a,b,c][1]
}`));

const testParseExpr = tester(parseExpr);

console.log(testParseExpr(`expr {
	a = do Async {
		b <- y(1,[1,2])
		c <- do List {
			a <- [d,e]
			b <- [a,b]
		}
	}
}`));
*/

/*
console.log(testParse('a - 3 - 3 ** 5 ** 7'));
console.log(testParse('--a++ + 5 + 6 * 7'));
console.log(testParse('delete --a'));
console.log(testParse('delete a => y'));

console.log(testParse('abc[1][2].9[5]((b()), a, 7)'));
console.log(testParse('[a()([1,2,3])]'));

console.log(testParse(`do Array { 
	x <- [1,2,3]
	y <- [4,5,6]
	[x + y]
}`));

console.log(testParse('abc.def((Async.unit(123)))'));

console.log(testParse(`do Array {
	x <- [1,2,3]
	y <- do Array {
		a <- [1, 2]
		b <- [3, 4]
		[a * b]
	}
	c <- expr { [1, 2, 5] }
	[x - y]
}`));


console.log(testParse('true + false'));
*/

//console.log(testParse('(x >=> f)(a) >>= 7'));

//console.log(testParse(`if (x < 5) do Async { x <- 5 return true } else false`))


//console.log(testParse('a.b.c'));

//console.log(testParse('expr { a <$> (b <|> d) <*> c }'));
//console.log(testParse('abc(def, ghi)'));
console.log(transformJS(`do Async {
	a <- b
	c <- d
	f <- do Array {
		a <- [1,2,3]
		b <- [3,4,5]
		return a * b
	}
	return [a + c].concat(f)
}`))
//console.log(testParse('return a'));

/*
console.log(testParse('(a => a)([1,2,3])'));
/*
//*/
//const res6 = "(x,y) => (x+y)";
//console.log(testParse(res6));

/*
const doTest = `do Async {
	x <- y
	x = y
	do! x
	a <- do Async {
		x <- y
	}
	y = x
	do! do Async {
		x <- y
	}
	a = x => y
}
`;

console.log(testParse2(doTest));*/


/*
const object2 = '{ 99: "ey" }';
console.log(testParse(object2));*/
}

//test();