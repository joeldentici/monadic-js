

/**
 *	MonadicJS.Do.Generate
 *	written by Joel Dentici
 *	on 7/10/2017
 *
 *	Generates JavaScript output from a
 *	Transformed AST.
 */

/**
 *	generate :: AST -> string
 *
 *	Maps the AST to a string by traversing it
 *	and mapping each node that is encountered to a string.
 */
const generate = module.exports = function(ast) {
	return ast.case({
		BinaryOperatorExpression: generateBinary,
		UnaryOperatorExpression: generateUnary,
		IdExpression: id => id,
		NumberExpression: num => num,
		StringExpression: str => str,
		BooleanExpression: bool => bool,
		ArrayExpression: generateArray,
		ObjectExpression: generateObject,
		ObjectBinding: (left, right) => 
			left + " : " + generate(right),
		IdBinding: id => id,
		SingleMember: id => id,
		MemberRenaming: (left, right) =>
			left + " : " + right,
		ObjectDestructure: generateObject,
		ArrayDestructure: ids =>
			'[ ' + ids.join(', ') + ' ]',
		ArrowList: params => 
			'(' + params.map(generate).join(', ') + ')',
		ArrowExpression: (sig, body) =>
			generate(sig) + ' => ' + generate(body),
		IfElseBlock: generateIf,
		VarBindingExpression: generateVar,
		DoStatement: generateDoStatement,
		Block: e => '{ ' + generate(e) + ' }',
		Parened: e => '( ' + generate(e) + ' )',
	})
}

function generateDoStatement(statement, next) {
	return generate(statement) + ';\n' + generate(next);
}

function generateIf(cond, tBranch, fBranch) {
	return `( (${generate(cond)}) ? (${generate(tBranch)}) : (${generate(fBranch)}) )`;
}

function generateVar(lvalue, expr) {
	const dec = lvalue.case({
		IdExpression: id => id.indexOf('.') > -1 ? '' : 'const ',
		default: _ => 'const '
	});

	return dec + generate(lvalue) + ' = '
	 + generate(expr);
}

function generateArray(exprs) {
	return '[ ' + exprs.map(generate).join(', ') + ' ]';
}

function generateObject(bindings) {
	return '({ ' + bindings.map(generate).join(', ')
	 + ' })';
}


const unaryOpText = {
	Return: e => 'return ' + e,
	Delete: e => 'delete ' + e,
	TypeOf: e => 'typeof ' + e,
	New: e => 'new ' + e,
	PostDecrement: e => e + '--',
	PostIncrement: e => e + '++',
	Negate: e => '-' + e,
	Plus: e => '+' + e,
	PreDecrement: e => '--' + e,
	PreIncrement: e => '++' + e,
	LogicalNegate: e => '!' + e,
};

function generateUnary(op, expr) {
	return unaryOpText[op](generate(expr));
}

const binaryOpText = {
	Exponentiation: '**',
	Remainder: '%',
	Division: '/',
	Multiplication: '*',
	Addition: '+',
	Subtraction: '-',
	LeftShift: '<<',
	RightShift: '>>',
	UnsignedRightShift: '>>>',
	LessThan: '<',
	LessThanEqual: '<=',
	GreaterThan: '>',
	GreaterThanEqual: '>=',
	In: 'in',
	InstanceOf: 'instanceof',
	Equal: '===',
	NEqual: '!==',
	BitAND: '&',
	BitXOR: '^',
	BitOR: '|',
	LogicalAND: '&&',
	LogicalOR: '||',
};

function generateBinary(op, left, right) {
	if (binaryOpText[op]) {
		return generate(left) + ' ' + binaryOpText[op]
		 + ' ' + generate(right);
	}
	else if (op === 'FunctionApplication') {
		return generate(left) + '(' + right.map(generate).join(', ')
		 + ')';
	}
	else if (op === 'MemberAccess') {
		return generate(left) + '.' + generate(right);
	}
	else if (op === 'ComputedMemberAccess') {
		return generate(left) + '[' + generate(right) + ']';
	}
	else {
		console.error("I forgot this operator: ", op);
		process.exit();
	}
}