const Lexer = require('./lexer.js');
const {expr} = require('./parsedo.js');
const analyze = require('../analyzedo.js');
const transform = require('../transformdo.js');
const generate = require('../generate.js');
const [grammar, mappers] = require('./lexical-grammar.js');
const P = require('../parser');
const Either = require('../either');

/**
 *	MonadicJS.Do.TransformJS
 *	written by Joel Dentici
 *	on 7/10/2017
 *
 *	This module provides a function to transform
 *	JavaScript source that contains do and expr
 *	blocks to an equivalent one with those blocks
 *	mapped to actual JavaScript syntax.
 *
 *	This relies on lexing the source, scanning until
 *	a block is found, emitting tokens that are not
 *	part of a block immediately to the output buffer.
 *
 *	Once a block is found, we begin parsing at the current
 *	input position. The AST of the parsed block is then
 *	analyzed and transformed to get a new AST with only
 *	JavaScript syntax. That AST is finally mapped back to 
 *	JavaScript source code by the generator.
 *
 *	After a block has been fully transformed, we begin
 *	scanning and immediate re-emitting until we find another
 *	block.
 *
 *	The resulting output buffers are concatenated and returned.
 */

const lexer = new Lexer(grammar, mappers);

// transformExpr :: Parser Token string
// performs analysis, transformation, and generation
// after the AST is parsed
const transformExpr = expr.map(ast => generate(transform(analyze(ast))));
// transformBlock :: ([Token], int) -> Either ParseError (ParseResult string)
const transformBlock = P.runParser(transformExpr, false);


/**
 *	transformJS :: string -> Either string string
 *
 *	Transforms the input source code in the manner
 *	described above.
 *
 *	If an error occurs while parsing a do-block or
 *	expr block, then it will be returned after being
 *	formatted into a readable string. Otherwise,
 *	the resulting source code is returned. The first
 *	error to occur will stop any further transformation.
 */
const transformJS = module.exports = function(source) {
	const tokens = lexer.lex(source);

	let pos = 0;
	let token;
	let output = '';
	while (pos < tokens.length) {
		token = tokens[pos];

		if (token.lexeme === 'Do' || token.lexeme === 'Expr') {
			const res = transformBlock(tokens, pos);

			const error = res.case({
				Right: ({pos: pos2, val}) => {
					pos = pos2;
					output += val;
					return null;
				},
				Left: err => P.showError(err)(tokens),
			});

			if (error)
				return Either.Left(error);
		}
		else {
			output += token.value;
			pos++;
		}
	}

	return Either.Right(output);
}