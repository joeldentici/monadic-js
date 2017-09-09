const CaseClass = require('../utility.js').CaseClass;

class NumberExpression extends CaseClass {
	constructor(number) {
		super('NumberExpression');
		this.number = number;
	}

	doCase(fn) {
		return fn(this.number);
	}
}

class IdExpression extends CaseClass {
	constructor(id) {
		super('IdExpression');
		this.id = id;
	}

	doCase(fn) {
		return fn(this.id);
	}
}

class StringExpression extends CaseClass {
	constructor(string) {
		super('StringExpression');
		this.string = string;
	}

	doCase(fn) {
		return fn(this.string);
	}
}

class ArrayExpression extends CaseClass {
	constructor(expressions) {
		super('ArrayExpression');
		this.expressions = expressions;
	}

	doCase(fn) {
		return fn(this.expressions);
	}
}

class ObjectExpression extends CaseClass {
	constructor(bindings) {
		super('ObjectExpression');
		this.bindings = bindings;
	}

	doCase(fn) {
		return fn(this.bindings);
	}
}

class ObjectBinding extends CaseClass {
	constructor(leftExpr, rightExpr) {
		super('ObjectBinding');
		this.member = leftExpr;
		this.value = rightExpr;
	}

	doCase(fn) {
		return fn(this.member, this.value);
	}
}

class IdBinding extends CaseClass {
	constructor(idExpr) {
		super('IdBinding');
		this.member = idExpr;
	}

	doCase(fn) {
		return fn(this.member);
	}
}

class MemberRenaming extends CaseClass {
	constructor(member, name) {
		super('MemberRenaming');
		this.member = member;
		this.name = name;
	}

	doCase(fn) {
		return fn(this.member, this.name);
	}
}

class SingleMember extends CaseClass {
	constructor(member) {
		super('SingleMember');
		this.member = member;
	}

	doCase(fn) {
		return fn(this.member);
	}
}

class ObjectDestructure extends CaseClass {
	constructor(members) {
		super('ObjectDestructure');
		this.members = members;
	}

	doCase(fn) {
		return fn(this.members);
	}
}

class ArrayDestructure extends CaseClass {
	constructor(members) {
		super('ArrayDestructure');
		this.members = members;
	}

	doCase(fn) {
		return fn(this.members);
	}
}

class ArrowList extends CaseClass {
	constructor(parameters) {
		super('ArrowList');
		this.parameters = parameters;
	}

	doCase(fn) {
		return fn(this.parameters);
	}
}

class ArrowExpression extends CaseClass {
	constructor(signature, body) {
		super('ArrowExpression');
		this.signature = signature;
		this.body = body;
	}

	doCase(fn) {
		return fn(this.signature, this.body);
	}
}

class DoBindingStatement extends CaseClass {
	constructor(idExpr, doExpr) {
		super('DoBindingStatement');
		this.id = idExpr;
		this.expr = doExpr;
	}

	doCase(fn) {
		return fn(this.id, this.expr);
	}
}

class VarBindingExpression extends CaseClass {
	constructor(lValue, doExpr) {
		super('VarBindingExpression');
		this.lValue = lValue;
		this.expr = doExpr;
	}

	doCase(fn) {
		return fn(this.lValue, this.expr);
	}
}

class DoBlock extends CaseClass {
	constructor(monad, statements, isAst = false) {
		super('DoBlock');
		this.monad = monad;
		this.statements = statements;
		this.isAst = isAst;
	}

	doCase(fn) {
		return fn(this.monad, this.statements, this.isAst);
	}
}

class AstExpr extends CaseClass {
	constructor(lang, expr) {
		super('AstExpr');
		this.lang = lang;
		this.expr = expr;
	}

	doCase(fn) {
		return fn(this.lang, this.expr);
	}
}

function AstBlock(inner) {
	return inner.case({
		DoBlock: (m, s, a) => new DoBlock(m, s, true),
		AstExpr: _ => inner,
	});
}

class BinaryOperatorExpression extends CaseClass {
	constructor(op, left, right) {
		super('BinaryOperatorExpression');
		this.op = op;
		this.left = left;
		this.right = right;
	}

	doCase(fn) {
		return fn(this.op, this.left, this.right);
	}
}

class UnaryOperatorExpression extends CaseClass {
	constructor(op, expr) {
		super('UnaryOperatorExpression');
		this.op = op;
		this.expr = expr;
	}

	doCase(fn) {
		return fn(this.op, this.expr);
	}
}

class BooleanExpression extends CaseClass {
	constructor(bool) {
		super('BooleanExpression');
		this.bool = bool;
	}

	doCase(fn) {
		return fn(this.bool);
	}
}

class IfElseBlock extends CaseClass {
	constructor(cond, tBranch, fBranch) {
		super('IfElseBlock');
		this.cond = cond;
		this.tBranch = tBranch;
		this.fBranch = fBranch;
	}

	doCase(fn) {
		return fn(this.cond, this.tBranch, this.fBranch);
	}
}

module.exports = {
	BooleanExpression: bool => new BooleanExpression(bool),
	NumberExpression: num => new NumberExpression(num),
	IdExpression: id => new IdExpression(id),
	StringExpression: str => new StringExpression(str),
	ArrayExpression: exprs => new ArrayExpression(exprs),
	ObjectExpression: bindings => new ObjectExpression(bindings),
	ObjectBinding: left => right => new ObjectBinding(left, right),
	IdBinding: id => new IdBinding(id),
	SingleMember: id => new SingleMember(id),
	MemberRenaming: left => right => new MemberRenaming(left, right),
	ObjectDestructure: renamings => new ObjectDestructure(renamings),
	ArrayDestructure: ids => new ArrayDestructure(ids),
	ArrowList: params => new ArrowList(params),
	ArrowExpression: sig => body => new ArrowExpression(sig, body),
	DoBlock: monad => statements => new DoBlock(monad, statements),
	VarBindingExpression: lvalue => expr => new VarBindingExpression(lvalue, expr),
	DoBindingStatement: id => expr => new DoBindingStatement(id, expr),
	BinaryOperatorExpression: o => l => r => new BinaryOperatorExpression(o, l, r),
	UnaryOperatorExpression: o => e => new UnaryOperatorExpression(o, e),
	IfElseBlock: c => t => f => new IfElseBlock(c, t, f),
	AstExpr: i => e => new AstExpr(i, e),
	AstBlock
};