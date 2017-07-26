# Extensions Grammar
I haven't gotten around to writing a grammar for the parser combinators used to parse do notation and the expression extensions quite yet (I had one before I started, but then I had to add precedence parsing and then changed some stuff and now the grammar is for a completely different language).

In lieu of this, I have included some of the caveats below, along with the phrases that don't exist in JS.

## Extensions
Let's start with do-notation. From the main README.md, you could see that this is made up of do-blocks:
```js
do Monad {
  ...DoStatement
}
```

A DoStatement is just one of the following:
```js
do! Expression
```
```js
lvalue <- Expression
```
```js
dot|lvalue = Expression
```
```js
Expression
```

I'll explain Expression at the bottom since it is basically everything except those three above. Here are lvalue:
```js
[val, val2, val3]
```
```js
{a: b, c, d}
```
```js
a
```
So basically, lvalue is array destructuring, object destructuring, or a single identifier.

And dot:
```js
a.b.c
```
So dot is just two or more of identifiers separated by a '.'. Note that I have an expression type for this too (called member access), but its parser is a little weird since it is included in the precedence parsing section, so this is just a separate parser that recognizes the same thing. Unfortunately I haven't yet got to 'computed member access' (using brackets on an object or array) as a lvalue. It isn't a technical challenge, I just didn't do it yet. If you want to use it, you will have to just call a function with your object/array, the expression for the property to access, and the value you want to set that exists outside of do-notation for now.

The final statement in a do-notation block is the result of the block. If it is one of the binding forms, then the lvalue will be removed (with `do!` there is a hidden '_' which isn't really hygenic, but whatever. Actually that is important -- don't use '_' anywhere near a do-notation block! Sorry).

Finally, keep in mind that `return` means `Monad.of` inside a do-notation block, so its semantics are completely different. It will not let you do an early escape from the block. Use conditionals or guard for that. What is guard? It is a function that will prevent running further statements in a do-notation block if the condition is not false (only if you have an Alternative+Monad (MonadPlus) though, and its zero needs to obey the MonadPlus annihilation law). Speaking of guard, `guard Expression` inside a do-notation block transforms into `guard(Expression, Monad)`. Guard can be somewhat common and it makes no sense to have to specify the Monad you are using inside the do-notation block when you already specified it for the whole block, so it gets its own special form. This means you shouldn't name anything "guard" inside a do-notation block because it will get messed up (unless it is an lvalue which is fine, but just don't).

Ok so that is all there is really to know about do-notation other than that you can nest it (since do-notation is an Expression itself).

Now for the added operators:
```js
val >>= f //monadic bind/chain => val.chain(f)
f <$> val //functor map => val.map(f)
a <*> b <*> c //applicative sequential application => a.app(b).app(c)
a *> b //applicative sequencing, keeping the right result => a.seqR(b)
a <* b //applicative sequencing, keeping the left result => a.seqL(b)
val >> val //monadic sequencing, keeping the right result => a.chain(_ => val)
a <|> b //alternative composition, result depends on the Alternative used => a.alt(b)
f >=> g //kleisi composition of monadic functions => f.arrow(g)
```

Of course, as you can tell from README.md, you need to use an expression block with these operators:
```js
expr { Expression }
```

The next section will explain what IS an Expression, so that I don't have to explain what isn't one.

## Expression
Let's start with the primitive expressions. They are:
  * Identifiers (The regex for this isn't quite right)
  * String literals (of any form)
  * Number literals (I'm currently using a really bad regex for this though)
  * Boolean literals
  
Next we have literals for Array and Object, which are the same as in normal ES6.

Then we have arrows. It's easier to just define than explain so:
```js
ArrowSignature => Expression
```
where ArrowSignature is something like
```js
x //a single identifier
```
or
```js
(x, {a: b, c, d}, [x, y, z]) //multiple identifiers, object destructures, or array destructures in ()
```

Expressions can also be a do-notation block, an expression block, or an if-else expression (shown in the README).

The above are what I'll refer to as "value" expressions. Technically that is completely redundant and meaningless since all expressions have values, but in the context of precedence parsing it makes sense.

Expressions can also be operators of the following precedences. Keep in mind `Expression` below basically means something of the same or lower precedence, or any expression that is parenthesized:
20. Parenthesized Expressions
  * `'(' Expression ')'`
19. Special Operators
  * Function application: `Expression '(' Expression ...(',' Expression) ')'`
  * Member access: `Expression '.' Expression`
  * Computed member access: `Expression '[' Expression ']'`
18. Postfix Operators
  * Post decrement: `Expression '++'`
  * Post decrement: `Expression '--'`
17. Prefix Operators
  * Negate: `'-' Expression`
  * Plus: `'+' Expression`
  * Pre decrement: `'--' Expression`
  * Pre decrement: `'++' Expression`
  * Delete: `'delete' Expression`
  * TypeOf: `'typeof' Expression`
  * New: `'new' Expression`
  * LogicalNegate: `'!' Expression`
16. Infix - Right Associative
  * Exponentiation: `Expression '**' Expression`
15. Infix - Left Associative
  * Remainder: `Expression '%' Expression`
  * Division: `Expression '/' Expression`
  * Multiplication: `Expression '*' Expression`
14. Infix - Left Associative
  * Addition: `Expression '+' Expression`
  * Subtraction: `Expression '-' Expression`
13. Infix - Left Associative
  * Left Shift: `Expression '<<' Expression`
  * Unsigned Right Shift: `Expression '>>>' Expression`
12. Infix - Left Associative
  * Less than: `Expression '<' Expression`
  * Less than equal: `Expression '<=' Expression`
  * Greater than: `Expression '>' Expression`
  * Greater than equal: `Expression '>=' Expression`
  * In: `Expression 'in' Expression`
  * Instance of: `Expression 'instanceof' Expression`
11. Infix - Left Associative
  * Equal: `Expression ('==' | '===') Expression`
  * Not Equal: `Expression ('!=' | '!==') Expression`
10. Infix - Left Associative
  * Bitwise and: `Expression '&' Expression`
9. Infix - Left Associative
  * Bitwise xor: `Expression '^' Expression`
8. Infix - Left Associative
  * Bitwise or: `Expression '|' Expression`
7. Infix - Left Associative
  * Logical and: `Expression '&&' Expression`
6. Infix - Left Associative
  * Logical or: `Expression '||' Expression`
5. Infix - Left Associative
  * Applicative: `Expression '<*>' Expression`
  * Sequence Left: `Expression '<*' Expression`
  * Sequence Right: `Expression '*>' Expression`
  * Map: `Expression '<$>' Expression`
4. Infix - Left Associative
  * Alt: `Expression '<|>' Expression`
3. Infix - Left Associative
  * Bind: `Expression '>>=' Expression`
  * Sequence: `Expression '>>' Expression`
2. Infix - Right Associative
  * Kleisi: `Expression '>=>' Expression`
1. Prefix
  * Monadic return: `'return' Expression`
  * MonadPlus guard: `'guard' Expression`
  
  
Remember that an operator with a higher precedence binds more "tightly" with stuff around it and an operator with lower precedence binds more "loosly" with stuff around it. For example, function application always happens using the nearest expressions, where near is a measure of character distance. On the other hand, return will bind ANY expression on the right of it, no matter what it is composed of.

## Remarks
We haven't seen any thing like statement-bodied functions, loops, classes, or generator functions. None of these things can be used inside a do-notation or expression block. Parsing your code will fail and because the error messages currently suck, you will have no idea what went wrong. So don't use any of those things inside do-notation or expression.

I don't really have any plans to extend this further than its current state right now, with two exceptions:
  * Adding computed member access for l-values of regular variable binding
  * Desugaring to applicative applications where possible (Applicative Do)
  * Adding any helpful operators that people want if there is a standardized method to desugar to
  
At this point you should have a good idea of what you can and can't use in do-notation and expression blocks. Basically anything above is fair game, and anything else should be left in the surrounding code.

I hope you find this useful.
