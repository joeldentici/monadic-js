const λ = require('fantasy-check/src/adapters/nodeunit');

const {equals} = require('../test-lib.js');
const {identity, constant} = require('fantasy-combinators');

const transformJS = require('../src/do/transformjs.js');
const Either = require('../src/either');

function eq(test) {
	return function(a, b) {
		test.equals(equals(a, b), true);
	}
}

exports.Do = {
	'primitives': test => {
		const input = 'expr { 123 }';

		const input2 = 'expr { abc }';

		const input3 = 'expr { "abc" }';

		const input4 = 'expr { [ true, false ] }';

		const input5 = 'expr { { a, b, c: "d" } }';

		const input6 = 'expr { x => x + 1 }';

		const input7 = 'expr { (x, y) => x + y }';

		const input8 = 'expr { ([x, y]) => x + y }';

		const input9 = 'expr { ({a, b: c}) => a + c }';

		const _ = eq(test);

		_(transformJS(input), Either.of('123'));
		_(transformJS(input2), Either.of('abc'));
		_(transformJS(input3), Either.of('"abc"'));
		_(transformJS(input4), Either.of('[ true, false ]'));
		_(transformJS(input5), Either.of('{ a, b, c : "d" }'));
		_(transformJS(input6), Either.of('(x) => x + 1'));
		_(transformJS(input7), Either.of('(x, y) => x + y'));
		_(transformJS(input8), Either.of('([ x, y ]) => x + y'));
		_(transformJS(input9), Either.of('({ a, b : c }) => a + c'));

		test.done();
	},
	'operators': test => {
		const input = 'expr { delete a[5] }';
		const input2 = 'expr { new A(1, 2) }';
		const input3 = 'expr { typeof 5 }';
		const input4 = 'expr { ++a++ }';
		const input5 = 'expr { --a-- }';
		const input6 = 'expr { +a }';
		const input7 = 'expr { -a }';
		const input8 = 'expr { !a }';
		const input9 = 'expr { a.b.c }';
		const input10 = 'expr { a >>= f }';
		const input11 = 'expr { a >> b }';
		const input12 = 'expr { f <$> a }';
		const input13 = 'expr { f >=> g }';
		const input14 = 'expr { a <|> b }';
		const input15 = 'expr { a <*> b }';
		const input16 = 'expr { a *> b }';
		const input17 = 'expr { a <* b }';

		const _ = eq(test);

		_(transformJS(input), Either.of('delete a[5]'));
		_(transformJS(input2), Either.of('new ( A )(1, 2)'));
		_(transformJS(input3), Either.of('typeof 5'));
		_(transformJS(input4), Either.of('++a++'));
		_(transformJS(input5), Either.of('--a--'));
		_(transformJS(input6), Either.of('+a'));
		_(transformJS(input7), Either.of('-a'));
		_(transformJS(input8), Either.of('!a'));
		_(transformJS(input9), Either.of('a.b.c'));
		_(transformJS(input10), Either.of('a.chain(f)'));
		_(transformJS(input11), Either.of('a.chain((_) => b)'));
		_(transformJS(input12), Either.of('a.map(f)'));
		_(transformJS(input13), Either.of('f.arrow(g)'));
		_(transformJS(input14), Either.of('a.alt(b)'));
		_(transformJS(input15), Either.of('a.app(b)'));
		_(transformJS(input16), Either.of('a.seqR(b)'));
		_(transformJS(input17), Either.of('a.seqL(b)'));

		test.done();
	},
	'if': test => {

		const input = 'expr { if (a < b) a else a + b }';
		const output = '( (a < b) ? (a) : (a + b) )';

		const _ = eq(test);

		_(transformJS(input), Either.of(output));

		test.done();
	},
	'do': test => {
		const input = `do Async {
			a <- f()
			b <- c()
			x.y = a + b
			y = x.y + a
			[l,m] = [1,2]
			return x.y + y + l + m
		}`;

		const output = '( () => { return ( f )().chain((a) => { return ( c )().chain((b) => { x.y = a + b;\nconst y = x.y + a;\nconst [ l, m ] = [ 1, 2 ];\nreturn Async.of(x.y + y + l + m) }) }) } )()';

		const input2 = `do Async {
			a <- f()
		}`;
		const output2 = '( () => { return ( f )() } )()';

		const input3 = `do Async {
			do! f()
		}`;
		const output3 = '( () => { return ( f )() } )()';

		const input4 = `do Async {
			a = f()
		}`;
		const output4 = '( () => { return ( f )() } )()';


		const input5 = `do Async {
			a <- f()
			b <- g()
			do! guard a < b
			return a + b
		}`;
		const output5 = '( () => { return ( f )().chain((a) => { return ( g )().chain((b) => { return guard(a < b, Async).chain((_) => { return Async.of(a + b) }) }) }) } )()';

		const input6 = 'const a = expr { f >=> g }';
		const output6 = 'const a = f.arrow(g)';

		const _ = eq(test);

		_(transformJS(input), Either.of(output));
		_(transformJS(input2), Either.of(output2));
		_(transformJS(input3), Either.of(output3));
		_(transformJS(input4), Either.of(output4));
		_(transformJS(input5), Either.of(output5));
		_(transformJS(input6), Either.of(output6));

		test.done();
	}
}