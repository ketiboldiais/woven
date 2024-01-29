/** An object corresponding to a mathematical expression. */
abstract class MathExpression {
}

/** An object corresponding to an atomic expression. */
abstract class Atom extends MathExpression {}

/** An object corresponding to an integer. */
class Int extends Atom {
  $n: number;
  constructor(value: number) {
    super();
    this.$n = Math.floor(value);
  }
}

/** An object corresponding to a symbol. */
class Sym extends Atom {
  $s: string;
  constructor(symbol: string) {
    super();
    this.$s = symbol;
  }
}

/**
 * An object corresponding to a compound
 * expression. All compound expressions
 * comprise of an operator and a list
 * of arguments.
 */
abstract class Compound extends MathExpression {
  $op: string;
  $args: MathExpression[];
  constructor(op: string, args: MathExpression[]) {
    super();
    this.$op = op;
    this.$args = args;
  }
}
