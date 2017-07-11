const Either = require('../either');
const State = require('../state');
const {Map: ImmutableMap, Set: ImmutableSet} = require('immutable');
const {doM} = require('../utility.js');

/**
 *	MonadicJS.Parser.Parser
 *	written by Joel Dentici
 *	on 7/5/2017
 *
 *	Parser type. Implements applicative,
 *	alternative, functor, and monad algebras.
 *
 *	Parsers automatically detect and fail
 *	left recursion infinite descent of a parser, so that
 *	other parsers can be tried.
 *
 *	Parsers can be memoized. This
 *	increases parsing efficiency for grammars
 *	where backtracking is necessary (ie ambiguous grammars).
 */

class Parser_ {
	/**
	 *	new :: ([t] -> int -> LeftRecContext -> State ParseState (Either ParserError (ParseResult a))) -> Parser t a
	 *
	 *	Constructs a parser from the provided function.
	 */
	constructor(p) {
		this.p = p;
	}

	/**
	 *	app :: Parser t (a -> b) -> Parser t a -> Parser t b
	 *
	 *	Applicative Functor application
	 *
	 *	Returns a parser that:
	 *
	 *	Applies a function in parser context to the
	 *	result of a parser. If the function is curried
	 *	and has more arguments, then ap can be changed.
	 */
	app(parser) {
		return Parser(t => p => lrec => 
			//apply this parser to get function
			this.runParser(t)(p)(lrec)
			  //bind to return the new parser
			  // r1 :: Either ParseError (ParseResult (a -> b))
			 .bind(r1 => r1.case({
			 	//attempt applicative application
			 	//apply the provided parser to get its result
			 	Right: ({val: fn, pos, used}) => parser.runParser(t)(pos)(getlrec(lrec, p, pos))
			 	.map(r2 => r2.case({
			 		//
			 		Right: ({val, pos: pos2, used: used2}) => Succeed(pos2)(fn(val))(mergeUps(p, pos2, used, used2)),
			 		//return the Left(ParseError)
			 		Left: ({err, pos: pos2, used: used2}) => Fail(pos2)(err)(mergeUps(p, pos2, used, used2)),
			 	})),
			 	//return the Left(ParseError)
			 	Left: _ => State.unit(r1),
			 }))
		);
	}

	/**
	 *	ap :: Parser t a -> Parser t (a -> b) -> Parser t b
	 *
	 *	Applicative functor application, conforming to the
	 *	fantasy-land spec.
	 *
	 *	Unfortunately, the fantasy-land spec has the parameters
	 *	backwards from the Haskell function, which makes applicative
	 *	application unnatural. Use app for a more natural applicative
	 *	interface.
	 */
	ap(parser) {
		return parser.app(this);
	}

	/**
	 *	seqR :: Parser t a -> Parser t b -> Parser t b
	 *
	 *	Applicative Functor sequential application
	 *
	 *	Returns a parser that:
	 *
	 *	First applies this parser, then the provided
	 *	parser, dropping the result of this parser.
	 */
	seqR(parser) {
		return Parser.of(a => b => b).app(this).app(parser);
	}

	/**
	 *	seqL :: Parser t a -> Parser t b -> Parser t a
	 *
	 *	Applicative Functor sequential application
	 *
	 *	Returns a parser that:
	 *
	 *	First applies this parser, then the provided
	 *	parser, dropping the result of the provided parser.
	 */
	seqL(parser) {
		return Parser.of(a => b => a).app(this).app(parser);
	}

	/**
	 *	then :: Parser t a -> Parser t b -> Parser t b
	 *
	 *	Alias for seqR. Provided as the name is more
	 *	meaningful in the domain of parsing.
	 */
	then(parser) {
		return this.seqR(parser);
	}

	/**
	 *	skip :: Parser t a -> Parser t b -> Parser t a
	 *
	 *	Alias for seqL. Provided as the name is more
	 *	meaningful in the domain of parsing.
	 */
	skip(parser) {
		return this.seqL(parser);
	}

	/**
	 *	alt :: Parser t a -> Parser t b -> Parser t (a | b)
	 *
	 *	Alternative Applicative Functor choice application
	 *
	 *	Returns a parser that:
	 *
	 *	Applies this parser first. If it fails, then
	 *	the provided parser is applied. The result of
	 *	the last applied parser is returned.
	 */
	alt(parser) {
		return Parser(t => p => lrec =>
			this.runParser(t)(p)(lrec)
			    .bind(r => r.case({
			    	Right: _ => State.unit(r),
			    	Left: ({err, pos, used}) => err instanceof FatalParseError ? State.unit(r) :
			    	parser.runParser(t)(p)(lrec)
			    	.map(r2 => r2.case({
			    		Right: ({pos,val,used: used2}) => Succeed(pos)(val)(used.union(used2)),
			    		Left: ({pos: pos2,err: err2,used: used2}) => mergeErrors(pos, pos2, err, err2)(used.union(used2)),
			    	})),
			    }))
		);
	}

	/**
	 *	or :: Parser t a -> Parser t b -> Parser t (a | b)
	 *
	 *	Alias for alt. Provided as the name is more meaningful
	 *	in the domain of parsing.
	 */
	or(parser) {
		return this.alt(parser);
	}

	/**
	 *	wrap :: Parser t a -> Parser t b -> Parser t c -> Parser t a
	 *
	 *	Returns a parser that applies (prev, this, next) in sequence,
	 *	keeping the results of this.
	 *
	 *	Equivalent to prev.seqR(this).seqL(next)
	 */
	wrap(prev, next) {
		return prev.seqR(this).seqL(next);
	}

	/**
	 *	trim :: Parser t a -> Parser t b -> Parser t a
	 *
	 *	Returns a parser that applies (around, this, around) in sequence,
	 *	keeping the results of this.
	 *
	 *	Equivalent to this.wrap(around, around) or around.seqR(this).seqL(around).
	 */
	trim(around) {
		return this.wrap(around, around);
	}

	/**
	 *	some :: Parser t a -> Parser t [a]
	 *
	 *	Alternative Applicative Functor some
	 *
	 *	Returns a parser that:
	 *
	 *	Applies this parser at least once to
	 *	get a list of the results that this parser
	 *	returns.
	 */
	get some() {
		return this.map(cons).app(this.many);
	}

	/**
	 *	sepByPlus :: Parser t a -> Parser t b -> Parser t [a]
	 *
	 *	Same as sepBy, but expects this parser to match
	 *	at least once. Essentially the same as the distinction
	 *	between some and many.
	 */
	sepByPlus(parser) {
		return this.seqL(parser.alt(Parser.empty)).some;
	}

	/**
	 *	many :: Parser t a -> Parser t [a]
	 *
	 *	Alternative Applicative Functor many
	 *
	 *	Returns a parser that:
	 *
	 *	Applies this parser zero or more times
	 *	to get a list of the results that this
	 *	parser returns.
	 */
	get many() {
		return this.or(Parser.empty)
			.bind(x => x ?
			 this.many.map(xs => [x].concat(xs))
			  : Parser.of([]));
	}

	/**
	 *	sepBy :: Parser t a -> Parser t b -> Parser t [a]
	 *
	 *	Returns a parser that tries to repeat applications
	 *	of this parser, separated by applications of the
	 *	provided parser.
	 *
	 *	This is equivalent to looking for this parser
	 *	followed by the provided parser or the empty parser
	 *	an [0, infinity) (many) number of times.
	 */
	sepBy(parser) {
		return this.seqL(parser.alt(Parser.empty)).many;
	}

	/**
	 *	map :: Parser t a -> (a -> b) -> Parser t b
	 *
	 *	Functor map
	 *
	 *	Returns a parser that:
	 *
	 *	Applies this parser to the input. If it succeeds,
	 *	the provided function is applied to its result
	 *	and the result of that application is returned.
	 */
	map(f) {
		return Parser(t => p => lrec => 
			//apply this parser to get result
			this.runParser(t)(p)(lrec)
			  // r1 :: Either ParseError (ParseResult a)
			 .map(r1 => r1.case({
			 	//attempt applicative application
			 	//apply the provided parser to get its result
			 	Right: ({val, pos, used}) => Succeed(pos)(f(val))(used),
			 	//return the Left(ParseError)
			 	Left: _ => r1,
			 }))
		);
	}

	/**
	 *	result :: Parser t a -> b -> Parser t b
	 *
	 *	Returns a parser that runs this parser first,
	 *	but always maps its result to the provided value.
	 *
	 *	Useful with stringTerm parsers that only recognize
	 *	a single value, but you may want a static, semantically
	 *	meaningful result.
	 */
	result(value) {
		return this.map(_ => value);
	}

	/**
	 *	fallback :: Parser t a -> b -> Parser t (a | b)
	 *
	 *	Returns a parser that first tries this parser,
	 *	but always returns the provided value when this
	 *	parser fails.
	 *
	 *	Equivalent to this.alt(Parser.of(value))
	 */
	fallback(value) {
		return this.alt(Parser.of(value));
	}

	/**
	 *	bind :: Parser t a -> (a -> Parser t b) -> Parser t b
	 *
	 *	Monadic bind
	 *
	 *	Returns a parser that:
	 *
	 *	First applies this parser to get a result. If
	 *	successful, the provided function is applied
	 *	to the result to get a new parser. That parser
	 *	is then applied to get the result.
	 *
	 *	You should use the applicative interface
	 *	in cases where you don't need to make context-sensitive
	 *	decisions. Obviously if context is required to parse,
	 *	the monadic interface must be used as it is the only
	 *	combinator that allows decisions to be made at runtime.
	 */
	bind(f) {
		return Parser(t => p => lrec => 
			//apply this parser to get result
			this.runParser(t)(p)(lrec)
			  // r1 :: Either ParseError (ParseResult a)
			 .bind(r1 => r1.case({
			 	// f(val)(t)(pos)(lrec) :: State ParseState (Either ParseError (ParseResult b))
			 	Right: ({val, pos, used}) => f(val).runParser(t)(pos)(getlrec(lrec, p, pos))
			 	.map(r2 => r2.case({
			 		Right: ({val,pos: pos2,used: used2}) => Succeed(pos2)(val)(mergeUps(p, pos2, used, used2)),
			 		Left: ({err,pos: pos2, used: used2}) => Fail(pos2)(err)(mergeUps(p, pos2, used, used2)),
			 	})),
			 	//return the Left(ParseError)
			 	Left: _ => State.unit(r1),
			 }))
		);
	}

	/**
	 *	chain :: Parser t a -> (a -> Parser t b) -> Parser t b
	 *
	 *	Alias for bind. Provided for fantasy-land compliance.
	 */
	chain(f) {
		return this.bind(f);
	}

	/**
	 *	memoize :: Parser t a -> bool? -> any? -> Parser t a
	 *
	 *	Returns an equivalent parser that memoizes
	 *	results, up to curtailment of left recursion.
	 *
	 *	This should generally be applied to non-terminals.
	 *	Applying it too liberally can actually cause worse
	 *	performance.
	 *
	 *	The optional boolean argument tells memoize whether
	 *	the original parser is even or odd (based on how
	 *	many parsers it chains together, only at the top
	 *	level). This is used to give the correct left-most
	 *	parse when left-recursion occurs because it lets us
	 *	avoid an off-by-one error when we attribute curtailment
	 *	too deep by assuming an even parity.
	 *
	 *	The optional name argument allows you to provide the
	 *	value that will be used in internal maps and sets. Absent
	 *	it, the parser itself will be used. It may be possible to
	 *	get better performance by using an integer, for example than
	 *	an object.
	 */
	memoize(even, name) {
		const self = this;

		//using an integer for the name
		//can be substantially faster than
		//an object when hashing
		name = name || self;

		//make the even argument default to
		//true. we need this instead of default
		//arg because we expect a boolean and defaults
		//only replace if undefined (not null or number
		//or anything else)
		if (typeof even !== 'boolean')
			even = true;

		//check based on parity of remaining input
		//and parity of parser whether we should
		//reuse an earlier result in a left-recursion
		//chain.
		const useresult = t =>
			(t % 2 === 0 ? !even : even);

		return Parser(t => p => lrec =>
			doM(function*() {
				let mt = yield State.get;

				let res = lookup(name, p, lrec, mt);
				if (res) {
					return State.unit(res);
				}
				else {
					const depth = lrec.getIn([name], 0);
					if (depth > t.length - p + 1) {
						res = Fail(p)(new Error('Curtailment'))(ImmutableSet([name]));

						return State.unit(res);
					}

					//run this parser a level deeper
					const newLrec = lrec.setIn([name], depth + 1);
					res = yield self.runParser(t)(p)(newLrec);

					//check for a better result in the state.
					//this will happen when we have indirect
					//left recursion. this was not needed in
					//the original algorithm where the result
					//tree was accessed by going through the state
					//(because all parses, not just the leftmost
					//were used). but we are passing the result
					//up the call stack so we need to check now
					//for a better result to use.
					//
					//there are probably better ways to do this.
					mt = yield State.get;
					let res2 = lookup(name, p, lrec, mt);
					if (useresult(t.length - p) && res2) {
						res = res.case({
							Right: _ => res,
							Left: _ => res2.case({
								Right: _ => res2,
								Left: _ => res,
							})
						});
					}

					const p_ctx = pruneContext(res.case({
						Left: ({used}) => used,
						Right: ({used}) => used,
					}), lrec);

					yield State.modify(mt => mt.setIn([name, p], [res, p_ctx]));
					
					return State.unit(res);
				}
			})
		);
	}

	/**
	 *	runParser :: Parser t a -> [t] -> int -> LeftRecContext -> State ParseState (Either ParseError (ParseResult a))
	 *
	 *	Runs the parser on the provided input, at the provided position, given
	 *	the provided LeftRecContext (left recursion depth map).
	 *
	 *	Returns a State monad value that can be applied to the current (including initial)
	 *	ParseState to get the parser's result.
	 *
	 *	Note: This is used internally. Use Parser.runParser to run the outermost parser for
	 *	your grammar. Doing so will also run the State monad, allowing you to inspect the results.
	 */
	runParser(input) {
		return pos => l_context => this.p(input)(pos)(l_context);
	}
}

/* Definitions of static members of the Parser type */

/**
 *	Parser :: ([t] -> int -> LeftRecContext -> State ParseState (Either ParserError (ParseResult a))) -> Parser t a
 *
 *	Constructs a Parser from the provided function.
 */
const Parser = module.exports = p => new Parser_(p);

/**
 *	of/unit :: a -> Parser t a
 *
 *	Returns a parser whose result is the value
 *	provided (always). This parser always succeeds
 *	without consuming any input.
 */
Parser.of = Parser.unit = x => Parser(_ => p => _ => State.unit(Succeed(p)(x)(ImmutableSet())));

/**
 *	empty :: Parser t ()
 *
 *	A parser with no result. This parser always succeeds
 *	without consuming any input.
 */
Parser.empty = Parser.of();

/**
 *	zero :: () -> Parser t ()
 *
 *	Constant function returning the empty parser.
 *
 *	Exists for fantasy-land compatability.
 */
Parser.zero = () => Parser.empty;

/* Useful helpers */

/**
 *	getlrec :: LefRecContext -> int -> int -> LeftRecContext
 *
 *	Returns the LeftRecContext that should be used:
 *
 *	If the oldPos is not the newPos (in other words,
 *	the prior parser consumed input), then the LeftRecContext
 *	should be reset, otherwise the same one is passed down.
 */
function getlrec(lrec, oldPos, newPos) {
	if (oldPos === newPos)
		return lrec;
	else
		return ImmutableMap();
}

/**
 *	mergeUps :: int -> int -> Set a -> Set a -> Set a
 *
 *	Merges the provided up contexts (sets of parsers
 *	that led to curtailment due to left recursion):
 *
 *	If oldP is not the newP (some input was consumed
 *	in the second parser), then the first context is
 *	returned. Otherwise, the contexts are merged.
 */
function mergeUps(oldP, newP, oldUp, newUp) {
	if (oldP === newP)
		return oldUp.union(newUp);
	else
		return oldUp;
}

/**
 *	pruneContext :: Set (Parser t any) -> Map (Parser t any) int -> Map (Parser t any) int
 *
 *	Removes entries from the provided LeftRecContext that do not appear
 *	in the cutailment set.
 */
function pruneContext(upCtx, downCtx) {
	if (!upCtx.size)
		return ImmutableMap();

	return downCtx.filter((c, p) =>
		upCtx.has(p)
	);
}

/**
 *	lookup :: Parser t a -> int -> LeftRecContext -> Map (Parser t a) (Map int (Either ParseError [(ParseResult a), LeftRecContext])) -> ParseResult a | null
 *
 *	Tries to find a valid result in the memoization table for the provided
 *	parser.
 */
function lookup(parser, pos, current, table) {
	const stored = table.getIn([parser, pos]);
	if (!stored)
		return null;

	const [res, stCtx] = stored;

	if (canReuse(current, stCtx)) {
		return res;
	}
	else {
		return null;
	}
}

/**
 *	canReuse :: LeftRecContext -> LeftRecContext -> bool
 *
 *	Checks whether a result can be reused in the current
 *	parsing context.
 */
function canReuse(current, stored) {
	return stored.every((count, parser) =>
			count <= current.get(parser, -1)
	);
}



/**
 *	cons :: a -> [a] -> [a]
 *
 *	Contructs a list from a head element
 *	and a tail list.
 */
const cons = x => xs => [].concat(x, xs);

class ParseResult_ {
	constructor(pos, val, used) {
		this.pos = pos;
		this.val = val;
		this.used = used;
	}
}

class ParseError_ {
	constructor(pos, err, used) {
		this.pos = pos;
		this.err = err;
		this.used = used;
	}
}

class ExpectedError extends Error {
	constructor(expected) {
		if (!(expected instanceof Array))
			expected = [expected];
		super('Expected ' + expected.join(', '));
		this.expected = expected;
	}
}

Parser.ExpectedError = ExpectedError;

class FatalParseError extends Error {

}

Parser.FatalParseError = FatalParseError;

function mergeErrors(pos, pos2, err, err2) {
	if (err instanceof FatalParseError)
		return Fail(pos)(err);
	else if (err2 instanceof FatalParseError)
		return Fail(pos2)(err2);
	else if (err instanceof ExpectedError
		&& err2 instanceof ExpectedError)
		return Fail(pos2)(new ExpectedError([].concat(err.expected, err2.expected)));
	else
		return Fail(pos2)(err2);
}


/**
 *	ParseResult :: int -> a -> ParseResult a
 *
 *	Returns a ParseResult, representing a parse
 *	that has consumed tokens up to (p - 1) and
 *	has yielded the value x.
 */
const ParseResult = p => x => lrec => new ParseResult_(p, x, lrec);

/**
 *	Succeed :: int -> a -> Either ParseError (ParseResult a)
 *
 *	See ParseResult. Applies ParseResult to p, x and then
 *	wraps the return value in an Either context.
 */
const Succeed = Parser.Succeed = p => x => lrec => Either.Right(ParseResult(p)(x)(lrec));

/**
 *	ParseError :: int -> Error -> ParseError
 *
 *	Returns a ParseError, representing a parse
 *	that failed after consuming tokens up to (p - 1)
 *	with the provided error.
 */
const ParseError = p => e => lrec => new ParseError_(p, e, lrec);

/**
 *	Fail :: int -> Error -> ParseError
 *
 *	See ParseError. Applies ParseError to p, e and then
 *	wraps the return value in an Either context.
 */
const Fail = Parser.Fail = p => e => lrec => Either.Left(ParseError(p)(e)(lrec));

/* Additional static parsers */


/**
 *	stringTerm :: string -> Parser string string
 *
 *	Recognizes the provided term.
 *
 *	Can be thought of as a CFG terminal.
 *
 *	Aliases: term
 */
Parser.term = Parser.stringTerm = x => Parser(t => p => lrec =>
	(t.substring(p) || "").startsWith(x) ? 
	   State.unit(Succeed(p + x.length)(x)(ImmutableSet()))
	: 
	   State.unit(Fail(p)(new ExpectedError(x))(ImmutableSet()))
);

/**
 *	regexTerm :: RegExp -> string -> Parser string [string]
 *
 *	Recognizes strings in the input matching
 *	the provided regular expression. The result
 *	when successful is a list of matches, which
 *	is what is returned by the JavaScript string
 *	match function.
 *
 *	Aliases: regex
 */
Parser.regex = Parser.regexTerm = x => name => Parser(t => p => lrec => {
	const matches = (t.substring(p) || "").match(x);

	if (matches) {
		return State.unit(Succeed(p + matches[0].length)(matches)(ImmutableSet()));
	}
	else {
		return State.unit(Fail(p)(new ExpectedError(name))(ImmutableSet()));
	}
});

/**
 *	tokenTerm :: (t -> bool) -> Parser t t
 *
 *	Recognizes tokens in the input which the
 *	provided predicate returns true for. The
 *	matching token is returned when successful.
 *
 *	This is useful when you perform lexical analysis
 *	separately from parsing, as you cannot use the
 *	string or regex terminal parsers on tokens (obviously).
 *
 *	Aliases: token
 */
Parser.token = Parser.tokenTerm = x => name => Parser(t => p => lrec => {
	if (p < t.length && x(t[p])) {
		return State.unit(Succeed(p + 1)(t[p])(ImmutableSet()));
	}
	else {
		return State.unit(Fail(p)(new ExpectedError(name))(ImmutableSet()));
	}
});

/**
 *	recursive :: (() -> Parser t a) -> Parser t a
 *
 *	Creates a Parser that applies the provided
 *	function the first time the parser is used to get
 *	a parser to parse with. That parser is then used
 *	to parse the current and all subsequent inputs when
 *	the returned parser is used.
 *
 *	This allows the construction of recursive grammars,
 *	so that parsers can refer to ones that have not
 *	yet been defined.
 */
Parser.recursive = parser => {
	return Parser(t => p => lrec => {
		if (typeof parser === 'function')
			parser = parser();
		return parser.runParser(t)(p)(lrec);
	});
};

/**
 *	findToken :: (t -> bool) -> string -> Parser t t
 *
 *	Returns a parser that consumes input until it matches
 *	an input token with the provided predicate. If no match
 *	occurs, then an error is raised.
 *
 *	This is useful in conjunction with lookahead when
 *	parsing input that has been lexed. For raw input, regex
 *	is probably more useful.
 */
Parser.findToken = predicate => name => Parser(t => p => lrec => {
	const ind = t.slice(p).findIndex(predicate);

	if (ind > -1) {
		return State.unit(Succeed(ind + 1)(t[ind])(ImmutableSet()));
	}
	else {
		return State.unit(Fail(p)(new ExpectedError(name))(ImmutableSet()));
	}
});

/**
 *	lookahead :: Parser t a -> Parser t bool
 *
 *	Returns a parser that will check if the
 *	provided parser matches the upcoming input.
 *
 *	If it does, true is returned, otherwise false
 *	is returned. The resulting parser does not
 *	consume input.
 */
Parser.lookahead = parser => Parser(t => p => lrec => 
	parser.runParser(t)(p)(lrec)
		.map(r => r.case({
			Right: _ => Succeed(p)(true)(ImmutableSet()),
			Left: _ => Fail(p)(false)(ImmutableSet()),
		}))
);

/**
 *	any :: Parser t t
 *
 *	A parser that will consume the next token of input
 *	and return it as its result, no matter what it is.
 *
 *	If there is no input left, then an error is returned.
 */
Parser.any = Parser(t => p => lrec => {
	if (p < t.length)
		return State.unit(Succeed(p + 1)(t[p])(ImmutableSet()));
	else
		return State.unit(Fail(p)
			(new ExpectedError("any input"))(ImmutableSet()));
});

/**
 *	all :: Parser t [t]
 *
 *	A parser that will consume any remaining input.
 *
 *	It is not an error to already be at the end of the input,
 *	but an empty result will be returned if this is the case.
 */
Parser.all = Parser(t => p => lrec => {
	return State.unit(Succeed(t.length)(t.slice(p))(ImmutableSet()));
});

/**
 *	eof :: Parser t ()
 *
 *	A parser that expects to see the end of input.
 *
 *	If EOF has been reached, then an empty result is returned,
 *	otherwise an error is returned.
 */
Parser.eof = Parser(t => p => lrec => {
	if (p === t.length)
		return State.unit(Succeed(p)()(ImmutableSet()));
	else
		return State.unit(Fail(p)(new ExpectedError("EOF"))(ImmutableSet()));
});

/**
 *	fail :: Error -> Parser t ()
 *
 *	Returns a parser that always fails with
 *	the provided error.
 */
Parser.fail = error => Parser(t => p => lrec =>
	State.unit(Fail(p)(error)(ImmutableSet()))
);

/**
 *	showError :: ParseError -> ([t], int) -> string
 *
 *	Returns a formatted error message from the provided
 *	error.
 *
 *	The input to the parser should be provided, along with
 *	a context value that determines how much input around the
 *	position where the error ocurred should be shown.
 */
Parser.showError = err => (tokens, context = 30) => {
	const {err: error, pos: index} = err;

	const start = Math.max(0, index - context);
	const end = start + context;

	const sourceTokens = tokens.slice(start, end);

	const source = sourceTokens.map(t => t.value).join('');

	let errorMsg;
	if (error instanceof ExpectedError) {
		const expected = [...new Set(error.expected)];

		const expectedMessage = expected.length > 1 ?
			expected.slice(0, -1).join(', ') + ', or ' + expected.slice(-1)[0]
			: expected[0];

		errorMsg = 'Expected ' + expectedMessage;
	}
	else {
		errorMsg = error.message;
	}

	const message = `Error: ${errorMsg} in below source code (${index}): \n${source}\n\n`;

	return message;
}

const {mapM} = require('../utility.js');

Parser.seq = (...parsers) => mapM(Parser, x => x, parsers);