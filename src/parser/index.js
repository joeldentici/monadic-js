const State = require('../state').State;
const {Map: ImmutableMap} = require('immutable');
const Parser = require('./parser.js');

/**
 *	MonadicJS.Parser
 *	written by Joel Dentici
 *	on 7/3/2017
 *
 *	Applicative Parser combinators for JavaScript.
 *
 *	The parsers are LL(*) and uses a modified version of the parsing algorithm
 *	given by Frost, Hafiz, and Callaghan to handle left recursion
 *	and provide memoization of parse results. This is an LL parser, unlike the
 *	parser they give so it only returns the left-most parse (derivation) according
 *	to the grammar it is parsing.
 *
 *	These parsers do not require a separate lexical analysis step, but their
 *	performance can be improved by using one. The combinators can be used to perfrom
 *	this lexical analysis step, but it will probably be more efficient to write
 *	a procedure specific to this.
 *
 *	It implements the following Fantasyland algebras:
 *		Functor
 *		Apply
 *		Applicative
 *		Alt
 *		Plus
 *		Alternative
 *		Chain
 *		Monad
 *
 *	We also alias our names for the operations of the
 *	above algebras, as well as providing aliases for
 *	names specific to parsing.
 */

module.exports = Parser;


/**
 *	runParser :: (Parser t a, bool) -> [t] -> Either ParseError (ParseResult a)
 *
 *	Runs the provided parser on the provided input. Either
 *	a ParseError or ParseResult a is returned depending on
 *	whether the parser failed or succeeded. Both contain the position
 *	in the input last parsed. ParseError additionally contains an
 *	Error and ParseResult contains a value of type a.
 */
Parser.runParser = (parser, consumeAll = true) => input => {
	const pos = 0;
	const state = ImmutableMap();
	const lrec = ImmutableMap();

	if (consumeAll)
		parser = parser.skip(Parser.eof);

	const parse = parser.runParser(input)(pos)(lrec);

	const [result, outstate] = parse.runState(state);

	return result;
}