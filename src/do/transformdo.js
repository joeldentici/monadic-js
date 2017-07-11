const {
	BinaryOperatorExpression, UnaryOperatorExpression,
	IdExpression, DoBlock, DoBindingStatement, ArrowList,
	ArrowExpression, ArrayExpression, ObjectExpression,
	ObjectBinding, IfElseBlock, VarBindingStatement,
} = require('./doast.js');

const CaseClass = require('js-helpers').CaseClass;

/**
 *	MonadicJS.Do.Transform
 *	written by Joel Dentici
 *	on 7/10/2017
 *
 *	Provides a function to replace do-blocks,
 *	if-blocks, and other specialized syntax (non-js 
 *	operators) with valid js syntax.
 */

/**
 *	transform :: (AST, string, AST) -> AST
 *
 *	Transforms the AST in the manner described
 *	above.
 */
const transform = module.exports = function(ast, monad, next) {
	return ast.case({
		DoBlock: transformDoBlock,
		UnaryOperatorExpression: transformUnaryExpr(monad),
		BinaryOperatorExpression: transformBinaryExpr(monad),
		IfElseBlock: (c,t,f) => IfElseBlock(transform(c, monad))
			(transform(t, monad))
			(transform(f, monad)),
		ArrowExpression: (s, b) => ArrowExpression(s)
			(transform(b, monad)),
		ArrayExpression: exprs => ArrayExpression(
			exprs.map(e => transform(e, monad))
		),
		ObjectExpression: bindings => ObjectExpression(
			bindings.map(e => transform(e, monad))
		),
		ObjectBinding: (l, r) => ObjectBinding(l)
			(transform(r, monad)),
		VarBindingStatement: (l, e) => VarBindingStatement(l)
			(transform(e, monad)),
		DoStatement: transformDoStatement(monad),
		default: _ => ast,
	});
}

class DoStatement_ extends CaseClass {
	constructor(statement, nextStatement) {
		super('DoStatement');
		this.statement = statement;
		this.next = nextStatement;
	}

	doCase(fn) {
		return fn(this.statement, this.next);
	}
}
const DoStatement = s => n => new DoStatement_(s, n);

class Block_ extends CaseClass {
	constructor(expr) {
		super('Block');
		this.expr = expr;
	}

	doCase(fn) {
		return fn(this.expr);
	}
}
const Block = e => new Block_(e);

class Parened_ extends CaseClass {
	constructor(expr) {
		super('Parened');
		this.expr = expr;
	}

	doCase(fn) {
		return fn(this.expr);
	}
}
const Parened = e => new Parened_(e);

function transformDoStatement(monad) {
	return function(statement, next) {
		return statement.case({
			DoBindingStatement: (id, expr) => {
				const fn = BinaryOperatorExpression(
					'MemberAccess')
					(transform(expr, monad))
					(IdExpression('chain'));

				const arr = ArrowExpression
					(ArrowList([IdExpression(id)]))
					(Block(transform(next, monad)));

				const app = BinaryOperatorExpression(
					'FunctionApplication')
					(fn)
					([arr]);

				const ret = UnaryOperatorExpression(
					'Return')
					(app);

				return ret;
			},
			default: _ => DoStatement(
				transform(statement, monad))
				(transform(next, monad)),
		});
	}
}

function createDoStatement(statements) {
	if (statements.length === 1)
		return UnaryOperatorExpression(
			'Return')(statements[0]);
	else
		return DoStatement(statements[0])
			(createDoStatement(statements.slice(1)));
}

/**
 *	transformDoBlock :: (string, [AST]) -> AST
 *
 *	
 */
function transformDoBlock(monad, statements) {
	const start = DoBindingStatement('_')(getReturn(monad));

	const newStatements = [start].concat(statements);

	const statement = createDoStatement(statements);

	const chained = transform(statement, monad);

	const fn = ArrowExpression(
		ArrowList([]))
		(Block(chained));

	const app = BinaryOperatorExpression(
		'FunctionApplication')
		(Parened(fn))
		([]);

	//console.log(JSON.stringify(p, null, 2));

	//process.exit();

	return app;
}


function getReturn(monad, expr) {
	const args = expr ? [transform(expr, monad)] : [];

	const fn = BinaryOperatorExpression(
		'MemberAccess')
		(IdExpression(monad))
		(IdExpression('of'));

	const app = BinaryOperatorExpression(
		'FunctionApplication')
		(fn)
		(args);

	return app;
}

/**
 *	transformUnaryExpr :: string -> (string, AST) -> AST
 *
 *	Transforms return expressions to applications of
 *	the current monad's "of" function. If we are not
 *	in a do-block, then the return is left as is and
 *	will become a statement in the output JS.
 *
 *	All other unary operator expressions are returned
 *	unchanged.
 */
function transformUnaryExpr(monad) {
	return function(op, expr) {
		if (op === 'ReturnM' && monad) {
			return getReturn(monad, expr);
			/*const fn = BinaryOperatorExpression(
				'MemberAccess')
				(IdExpression(monad))
				(IdExpression('of'));

			const app = BinaryOperatorExpression(
				'FunctionApplication')
				(fn)
				([transform(expr, monad)]);

			return app;*/
		}
		else {
			return UnaryOperatorExpression(op)(transform(expr, monad));
		}
	}
}


const leftAccess = {
	BindOperator: 'chain',
	KleisiOperator: 'arrow',
	AlternativeOperator: 'alt',
	ApplicativeOperator: 'app',
	LeftSeqOperator: 'seqL',
	RightSeqOperator: 'seqR',
};

const rightAccess = {
	MapOperator: 'map',
}

/**
 *	transformBinaryExpr :: string -> (string, AST, AST) -> AST
 *
 *	Transforms the binary expression. If its operator is one
 *	of those in exprOps, then we transform it to the appropriate
 *	function application
 */
function transformBinaryExpr(monad) {
	return function(op, left, right) {
		if (leftAccess[op]) {
			const fn = BinaryOperatorExpression(
				'MemberAccess')
				(transform(left, monad))
				(IdExpression(leftAccess[op]));

			const app = BinaryOperatorExpression(
				'FunctionApplication')
				(fn)
				([transform(right, monad)]);

			return app;
		}
		else if (rightAccess[op]) {
			const fn = BinaryOperatorExpression(
				'MemberAccess')
				(transform(right, monad))
				(IdExpression(rightAccess[op]));

			const app = BinaryOperatorExpression(
				'FunctionApplication')
				(fn)
				([transform(left, monad)]);

			return app;
		}
		else if (op === 'FunctionApplication') {
			return BinaryOperatorExpression(
				op)
				(Parened(transform(left, monad)))
				(right.map(r => transform(r, monad)));
		}
		else {
			return BinaryOperatorExpression(
				op)
				(transform(left, monad))
				(transform(right, monad))
		}
	}
}
