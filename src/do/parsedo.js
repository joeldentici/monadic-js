const P = require('../parser');
const {
	ArrayExpression, ObjectExpression,
	IdBinding, ObjectBinding, SingleMember, MemberRenaming,
	ObjectDestructure, ArrayDestructure, ArrowList, 
	ArrowExpression, IdExpression, StringExpression,
	NumberExpression, VarBindingExpression, DoBindingStatement,
	DoBlock, BinaryOperatorExpression, UnaryOperatorExpression,
	BooleanExpression, IfElseBlock
} = require('./doast.js');

/**
 *	MonadicJS.Do.ParseDo
 *	written by Joel Dentici
 *	on 7/10/2017
 *
 *	This module defines the parser for
 *	do notation and expression blocks.
 *
 *	This should be used in conjunction with
 *	the lexer module and the provided lexical grammar.
 */

/* Ignore these tokens */
//combine into one token parser for speed
const ignoredTokens = new Set([
	'Whitespace',
	'Comment',
	'MultiLineComment'
]);
const ignored = P.token(t => ignoredTokens.has(t.lexeme))('Ignored').many;


/* Convenience parser constructors for ignoring above */
const word = parser => parser.trim(ignored);
const token = lexeme => word(P.token(t => t.lexeme === lexeme)(lexeme).map(t => t.value));
const operator = lexeme => word(P.token(t => t.lexeme === lexeme)(lexeme).result(lexeme));

/* The lexical grammar, repeated */
const _do = operator('Do');
const _expr = operator('Expr');
const sequence = operator('Sequence');
const arrow = operator('Arrow');
const assignment = operator('Assignment');
const bind = operator('Bind');
const lparen = operator('LParen');
const rparen = operator('RParen');
const lbracket = operator('LBracket');
const rbracket = operator('RBracket');
const lbrace = operator('LBrace');
const rbrace = operator('RBrace');
const semi = operator('Semicolon');
const comma = operator('Comma');
const dot = operator('Dot');
const langle = operator('LAngle');
const rangle = operator('RAngle');
const equal = operator('Equal');
const nequal = operator('NEqual');
const lequal = operator('LEqual');
const gequal = operator('GEqual');
const colon = operator('Colon');
const _else = operator('Else');
const _if = operator('If');
const _delete = operator('Delete');
const asterisk = operator('Asterisk');
const plus = operator('Plus');
const minus = operator('Minus');
const plusplus = operator('PlusPlus');
const minusminus = operator('MinusMinus');
const slash = operator('Slash');
const modulo = operator('Modulo');
const _instanceof = operator('InstanceOf');
const _in = operator('In');
const _true = operator('True').result(true);
const _false = operator('False').result(false);
const logand = operator('LogicalAND');
const logor = operator('LogicalOR');
const bitand = operator('BitAND');
const bitor = operator('BitOR');
const bitxor = operator('BitXOR');
const leftshift = operator('LeftShift');
const rightshift = operator('RightShift');
const unsignedrightshift = operator('UnsignedRightShift');
const bindop = operator('BindOperator');
const kleisiop = operator('KleisiOperator');
const altop = operator('AlternativeOperator');
const appop = operator('ApplicativeOperator');
const lseqop = operator('LeftSeqOperator');
const rseqop = operator('RightSeqOperator');
const mapop = operator('MapOperator');
const _return = operator('Return');
const _guard = operator('Guard');
const _typeof = operator('TypeOf');
const _new = operator('New');
const negate = operator('Negate');
const number = token('Number').map(Number);
const identifier = token('Identifier');
const string = token('String');

/* Parse Base Values */
//parse primitive expressions
const idExpr = identifier.map(IdExpression)
const numberExpr = number.map(NumberExpression)
const stringExpr = string.map(StringExpression)
const booleanExpr = _true.or(_false).map(BooleanExpression);


//parse an array expression
const array = P.recursive(() =>
	expr.sepBy(comma).wrap(lbracket, rbracket)
	 .map(ArrayExpression)
	 .memoize(true, 3)
);

//parse an object binding
const singleId = identifier.map(IdBinding);
const pairBinding = P.recursive(() =>
	P.of(ObjectBinding)
	 .app(identifier.or(string).or(number))
	 .skip(colon)
	 .app(expr)
);
const objectBinding = pairBinding.or(singleId);

//parse an object
const object = objectBinding
	.sepBy(comma)
	.wrap(lbrace, rbrace)
	.map(ObjectExpression)
	.memoize(true, 4)

//parse a destructure binding (for object)
const singleMember = identifier.map(SingleMember);
const memberRenaming = P.of(MemberRenaming)
	.app(identifier.or(string))
	.skip(colon)
	.app(identifier);
const destructurePiece = memberRenaming.or(singleMember);

//parse an object destructuring
const objectDestructure = destructurePiece
	.sepBy(comma)
	.wrap(lbrace, rbrace)
	.map(ObjectDestructure);

//parse an array destructure
const arrayDestructure = identifier
	.sepBy(comma)
	.wrap(lbracket, rbracket)
	.map(ArrayDestructure);

//parse a parameter of an arrow function
const arrowParam = objectDestructure
	.or(arrayDestructure)
	.or(idExpr);

//parse the parameter list of an arrow function
const arrowList = arrowParam
	.sepBy(comma)
	.wrap(lparen, rparen)
	.map(ArrowList);
//single parameter arrow function
const arrowId = idExpr.map(x => [x]).map(ArrowList);

//parse an arrow function signature
const arrowSignature = arrowId.or(arrowList);

//parse an arrow function
const arrowFunction = P.recursive(() =>
	P.of(ArrowExpression)
	 .app(arrowSignature)
	 .skip(arrow)
	 .app(expr)
	 .memoize(true, 5)
);


//the base value parser
const value = P.recursive(() =>
	arrowFunction
	.or(array)
	.or(object)
	.or(idExpr)
	.or(stringExpr)
	.or(numberExpr)
	.or(booleanExpr)
	.or(doBlock)
	.or(exprBlock)
	.or(ifElse)
);


/* Parse operators (expressions) */

/* Thanks Parsimmon creators for the example on precedence parsing
that I have adapted to use here */

/**
 *	operators :: Map string (Parser Token any) -> Parser Token string
 *
 *	Creates a single parser from a map from operator
 *	names to operator parsers. Each parser in the map
 *	is made to yield its name as its result.
 */
function operators(ops) {
	const keys = Object.keys(ops);
	const parsers = keys.map(k => ops[k].result(k));

	return parsers.reduce((ps, p) => ps.alt(p));
}

/**
 *	topLevel :: (a, Parser Token AST) -> Parser Token BinaryExpression
 *
 *	Creates a parser for the top level precedence operators
 *	in JavaScript. These are the member access and function application
 *	which both have weird syntax compared to other operators.
 */
function topLevel(_, nextParser) {
	nextParser = nextParser.memoize(false);

	const memberAccess = P.seq(
		dot.result('MemberAccess'),
		idExpr
	);

	const computedMemberAccess = P.recursive(() => P.seq(
		lbracket.result('ComputedMemberAccess'),
		expr.or(value),
		rbracket
	));

	const functionApplication = P.recursive(() => P.seq(
		lparen.result('FunctionApplication'),
		expr.sepBy(comma),
		rparen
	));

	const ops = memberAccess
		.or(computedMemberAccess)
		.or(functionApplication);


	return P.seq(
		nextParser,
		ops.many
	).map(([first, rest]) => 
		rest.reduce((acc, ch) => {
			const [op, another] = ch;
			return BinaryOperatorExpression(op)(acc)(another);
		}, first)
	);
}

/**
 *	prefix :: (Parser Token string, Parser Token AST) -> Parser Token AST
 *
 *	Creates a parser for a prefix operator(s).
 */
function prefix(operators, nextParser) {
	const parser = P.recursive(() =>
		P.of(UnaryOperatorExpression)
		 .app(operators)
		 .app(parser)
		 .or(nextParser)
	);

	return parser;
}

/**
 *	postfix :: (Parser Token string, Parser Token AST) -> Parser Token AST
 *
 *	Creates a parser for a postfix operator(s).
 */
function postfix(operators, nextParser) {
	return P.seq(
		nextParser,
		operators.many
	).map(([x, xs]) =>
		xs.reduce((acc, x) => UnaryOperatorExpression(x)(acc), x)
	);
}

/**
 *	infixRight :: (Parser Token string, Parser Token AST) -> Parser Token AST
 *
 *	Creates a parser for an infix operator(s) that is
 *	right associative.
 */
function infixRight(operators, nextParser) {
	const parser = P.recursive(() =>
		nextParser.bind(next =>
			P.of(BinaryOperatorExpression)
			 .app(operators)
			 .app(P.of(next))
			 .app(parser)
			 .or(P.of(next))
		)
	);

	return parser;
}

/**
 *	infixLeft :: (Parser Token string, Parser Token AST) -> Parser Token AST
 *
 *	Creates a parser for an infix operator(s) that is
 *	left associative.
 */
function infixLeft(operators, nextParser) {
	return P.seq(
		nextParser,
		P.seq(operators, nextParser).many
	).map(([first, rest]) => 
		rest.reduce((acc, ch) => {
			const [op, another] = ch;
			return BinaryOperatorExpression(op)(acc)(another);
		}, first)
	);
}

//precedence table of operators
const ops = [
	{type: topLevel, ops: null},
	{type: postfix, ops: operators({
		PostDecrement: minusminus,
		PostIncrement: plusplus
	})},
	{type: prefix, ops: operators({
		Negate: minus,
		Plus: plus,
		PreDecrement: minusminus,
		PreIncrement: plusplus,
		Delete: _delete,
		TypeOf: _typeof,
		New: _new,
		LogicalNegate: negate,
	})},
	{type: infixRight, ops: operators({
		Exponentiation: asterisk.then(asterisk)
	})},
	{type: infixLeft, ops: operators({
		Remainder: modulo,
		Division: slash,
		Multiplication: asterisk,
	})},
	{type: infixLeft, ops: operators({
		Addition: plus,
		Subtraction: minus
	})},
	{type: infixLeft, ops: operators({
		LeftShift: leftshift,
		UnsignedRightShift: unsignedrightshift,
	})},
	{type: infixLeft, ops: operators({
		LessThan: langle,
		LessThanEqual: lequal,
		GreaterThan: rangle,
		GreaterThanEqual: gequal,
		In: _in,
		InstanceOf: _instanceof,
	})},
	{type: infixLeft, ops: operators({
		Equal: equal,
		NEqual: nequal,
	})},
	{type: infixLeft, ops: bitand},
	{type: infixLeft, ops: bitxor},
	{type: infixLeft, ops: bitor},
	{type: infixLeft, ops: logand},
	{type: infixLeft, ops: logor},
	{type: infixLeft, ops: operators({
		ApplicativeOperator: appop,
		LeftSeqOperator: lseqop,
		RightSeqOperator: rseqop,
		MapOperator: mapop,
	})},
	{type: infixLeft, ops: altop},
	{type: infixLeft, ops: operators({
		BindOperator: bindop,
		SequenceOperator: rightshift,
	})},
	{type: infixRight, ops: kleisiop},
	{type: prefix, ops: operators({
		ReturnM: _return,
		GuardM: _guard
	})},
];

//parses expressions that can appear within
//an operator non-terminal
const operatorExpr = P.recursive(() =>
	value.or(expr.wrap(lparen, rparen))
	.memoize(false)
);

//parses the operators in the table above
const operatorParser = ops.reduce(
	(acc, level) => level.type(level.ops, acc),
	operatorExpr
);

//an expression is anything the operator parser can
//parse. the parser trims ignored tokens before applying
//the operator parser.
const expr = operatorParser.trim(ignored).memoize(false);


/* Parse do bindings */
//l-value member access
const dotL = identifier.sepByPlus(dot).map(ids => IdExpression(ids.join('.')));
const baseL = idExpr.or(objectDestructure).or(arrayDestructure);

//a regular variable binding
const lvalue = dotL.or(baseL);
const varBinding = P.recursive(() =>
	P.of(VarBindingExpression)
	 .app(lvalue)
	 .skip(assignment)
	 .app(expr)
	 .memoize(false, 8)
);

//a do binding
const doBinding = P.recursive(() =>
	P.of(DoBindingStatement)
	 .app(baseL)
	 .skip(bind)
	 .app(expr)
	 .memoize(false, 9)
);

//a do sequence
const doSequence = P.recursive(() =>
	P.of(DoBindingStatement)
	 .skip(sequence)
	 .app(P.of(IdExpression('_')))
	 .app(expr)
	 .memoize(false, 10)
);

/* Parse do statements */
const bindingStatement = doSequence.or(doBinding).or(varBinding);
const doStatement = bindingStatement.or(expr);

/* Parse do block */
const doBlock = P.of(DoBlock)
	.skip(_do)
	.app(identifier)
	.app(doStatement.many.wrap(lbrace, rbrace))
	.memoize(false, 11);


/* Parse expr block */
const exprBlock = _expr
	.then(expr.wrap(lbrace, rbrace))
	.memoize(false, 12);

/* Parse an if-else block */
const ifElse = P.of(IfElseBlock)
	.skip(_if)
	.app(expr.wrap(lparen, rparen))
	.app(expr)
	.skip(_else)
	.app(expr)
	.memoize(false, 13);

/* Export parsers for do and expr blocks */
const parse = P.runParser(expr, false);
const parseExpr = P.runParser(exprBlock, false);
const parseDo = P.runParser(doBlock, false);

module.exports = {
	expr,
	parse,
	parseExpr,
	parseDo,
};