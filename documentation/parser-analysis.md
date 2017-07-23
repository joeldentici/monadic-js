# Parser combinators - Computational Complexity
Informal analysis of theoretical complexity shows the following complexities for CFG (only a left-most parse is generated, but any deterministic CFG can be parsed, not just LL(\*) grammars) using only applicative composition and alternation (which is all that is needed to parse a CFG and probably the most efficient, though you can implement it in other manners). It is also assumed that you choose to memoize any parsers that may be applied more than once during the parse. The complexity is a function of `n`, the length of input to be parsed:

  * Non left-recursive CFG: `O(n log n)`
  * Left-recursive CFG: `O(n^2 log n)`
  
The `O(log n)` part of the complexity comes from the fact that we are using persistent maps for memoization and left-recursion detection. The `O(n)` part in the first case is due to the fact that we must apply each parser at most once to each input position due to memoization. The `O(n^2)` part in the second case is due to the fact that we may have to apply each parser to each input position `n` times (we detect left recursion at each input position, for each parser tried).
