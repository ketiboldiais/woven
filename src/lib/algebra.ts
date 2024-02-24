const show = console.log;

enum TAG {
  INT = "INT",
  REAL = "REAL",
  SYM = "SYM",
  RATIONAL = "RATIONAL",
  CONSTANT = "CONSTANT",
  SUM = "SUM",
  PRODUCT = "PRODUCT",
  POWER = "POWER",
  QUOTIENT = "QUOTIENT",
  FACTORIAL = "FACTORIAL",
  FUNCTION_FORM = "FUNCTION_FORM",
  RELATION = "RELATION",
  BOOLEAN_EXPRESSION = "BOOLEAN_EXPRESSION",
}

const isNumber = (x: any): x is number => (
  typeof x === "number"
);
const id = <T>(x: T) => x;

class SetX {
  set: Set<string | number>;
  constructor(data: (string | number)[]) {
    this.set = new Set(data);
  }

  has(elem: string | number) {
    return this.set.has(elem);
  }

  symmetricDifference(other: SetX) {
    const out = this.copy();
    for (const elem of other.set) {
      if (out.has(elem)) {
        out.delete(elem);
      } else {
        out.push(elem);
      }
    }
    return out;
  }

  difference(other: SetX) {
    const out = this.copy();
    for (const elem of other.set) {
      out.delete(elem);
    }
    return this;
  }

  card() {
    return this.set.size;
  }

  delete(element: string | number) {
    this.set.delete(element);
    return this;
  }

  push(element: string | number) {
    this.set.add(element);
    return this;
  }

  copy() {
    const out = new SetX([]);
    for (const elem of this.set) {
      out.push(elem);
    }
    return out;
  }

  union(other: SetX) {
    const out = this.copy();
    for (const elem of other.set) {
      out.push(elem);
    }
    return out;
  }

  intersection(other: SetX) {
    const out = new SetX([]);
    for (const elem of other.set) {
      if (this.set.has(elem)) {
        out.push(elem);
      }
    }
    return out;
  }

  forEach(callback: (element: string | number, index: number) => void) {
    let i = 0;
    for (const elem of this.set) {
      callback(elem, i);
      i++;
    }
    return this;
  }

  toString() {
    let out = "{";
    const setSize = this.card() - 1;
    this.forEach((element, index) => {
      out += `${element}`;
      if (index !== setSize) {
        out += ",";
      }
    });
    out += "}";
    return out;
  }
}

const set = (...data: (string | number)[]) => (
  new SetX(data)
);

const a = set(1, 2, 3, 4);
const b = set(4, 1, 2);
const c = a.symmetricDifference(b);
show(c);

abstract class Evaluator {
  kind: TAG;
  constructor(kind: TAG) {
    this.kind = kind;
  }
}

interface ExpressionVisitor<T> {
  int(expr: Int): T;
  real(expr: Real): T;
  sym(expr: Sym): T;
  rat(expr: Rational): T;
  constant(expr: Constant): T;
  sum(expr: Sum): T;
  product(expr: Product): T;
  power(expr: Power): T;
  quotient(expr: Quotient): T;
  factorial(expr: Factorial): T;
  functionForm(expr: FunctionForm): T;
  lessThan(expr: LessThan): T;
  greaterThan(expr: GreaterThan): T;
  equation(expr: Equation): T;
  nonEquation(expr: NonEquation): T;
  lessThanOrEqualTo(expr: LessThanOrEqualTo): T;
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): T;
  notExpression(expr: NotExpression): T;
  andExpression(expr: AndExpression): T;
  orExpression(expr: OrExpression): T;
}

abstract class Statement extends Evaluator {}
abstract class Expression extends Evaluator {
  parenLevel: number = 0;
  tickParen() {
    this.parenLevel += 1;
    return this;
  }
  abstract acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T;
}
type LogicalOperator = "not" | "and" | "or";
abstract class BooleanExpression extends Expression {
  operator: LogicalOperator;
  operands: [Expression] | [Expression, Expression];
  constructor(
    operator: LogicalOperator,
    operands: [Expression] | [Expression, Expression],
  ) {
    super(TAG.BOOLEAN_EXPRESSION);
    this.operator = operator;
    this.operands = operands;
  }
}

class NotExpression extends BooleanExpression implements Compound {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.notExpression(this);
  }
  operator: "not" = "not";
  operands: [Expression];
  constructor(operand: Expression) {
    super("not", [operand]);
    this.operands = [operand];
  }
  get arg() {
    return this.operands[0];
  }
}
const lnot = (arg: Expression) => (
  new NotExpression(arg)
);

class AndExpression extends BooleanExpression implements Compound {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.andExpression(this);
  }
  operator: "and" = "and";
  operands: [Expression, Expression];
  constructor(left: Expression, right: Expression) {
    super("and", [left, right]);
    this.operands = [left, right];
  }
}
const land = (a: Expression, b: Expression) => (
  new AndExpression(a, b)
);

class OrExpression extends BooleanExpression implements Compound {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.orExpression(this);
  }
  operator: "or" = "or";
  operands: [Expression, Expression];
  constructor(left: Expression, right: Expression) {
    super("or", [left, right]);
    this.operands = [left, right];
  }
}
const lor = (a: Expression, b: Expression) => (
  new OrExpression(a, b)
);

abstract class SetExpression extends Expression {}
abstract class NameForming extends Expression {}

type RELATION_OPERATOR = "<=" | ">=" | "<" | ">" | "=" | "!=";

abstract class RelationalExpression extends Expression implements Compound {
  operator: RELATION_OPERATOR;
  operands: [Expression, Expression];
  constructor(
    left: Expression,
    operator: RELATION_OPERATOR,
    right: Expression,
  ) {
    super(TAG.RELATION);
    this.operator = operator;
    this.operands = [left, right];
  }
}

class LessThan extends RelationalExpression {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.lessThan(this);
  }
  operator: "<";
  operands: [AlgebraicExpression, AlgebraicExpression];
  constructor(left: AlgebraicExpression, right: AlgebraicExpression) {
    super(left, "<", right);
    this.operator = "<";
    this.operands = [left, right];
  }
}

const lt = (a: AlgebraicExpression, b: AlgebraicExpression) => (
  new LessThan(a, b)
);

class LessThanOrEqualTo extends RelationalExpression {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.lessThanOrEqualTo(this);
  }
  operator: "<=";
  operands: [AlgebraicExpression, AlgebraicExpression];
  constructor(left: AlgebraicExpression, right: AlgebraicExpression) {
    super(left, "<=", right);
    this.operator = "<=";
    this.operands = [left, right];
  }
}

class GreaterThan extends RelationalExpression {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.greaterThan(this);
  }
  operator: ">";
  operands: [AlgebraicExpression, AlgebraicExpression];
  constructor(left: AlgebraicExpression, right: AlgebraicExpression) {
    super(left, ">", right);
    this.operator = ">";
    this.operands = [left, right];
  }
}
const gt = (a: AlgebraicExpression, b: AlgebraicExpression) => (
  new GreaterThan(a, b)
);

class GreaterThanOrEqualTo extends RelationalExpression {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.greaterThanOrEqualTo(this);
  }
  operator: ">=";
  operands: [AlgebraicExpression, AlgebraicExpression];
  constructor(left: AlgebraicExpression, right: AlgebraicExpression) {
    super(left, ">=", right);
    this.operator = ">=";
    this.operands = [left, right];
  }
}
const geq = (a: AlgebraicExpression, b: AlgebraicExpression) => (
  new GreaterThanOrEqualTo(a, b)
);

class Equation extends RelationalExpression {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.equation(this);
  }
  operator: "=";
  operands: [Expression, Expression];
  constructor(left: Expression, right: Expression) {
    super(left, "=", right);
    this.operator = "=";
    this.operands = [left, right];
  }
}
const eq = (a: Expression, b: Expression) => (
  new Equation(a, b)
);

class NonEquation extends RelationalExpression {
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.nonEquation(this);
  }
  operator: "!=";
  operands: [Expression, Expression];
  constructor(left: Expression, right: Expression) {
    super(left, "!=", right);
    this.operator = "!=";
    this.operands = [left, right];
  }
}
const neq = (a: Expression, b: Expression) => (
  new NonEquation(a, b)
);

abstract class AlgebraicExpression extends Expression {}

class Int extends AlgebraicExpression {
  value: number;
  constructor(value: number) {
    super(TAG.INT);
    this.value = Math.floor(value);
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.int(this);
  }
}
const int = (value: number) => (new Int(value));

class Real extends AlgebraicExpression {
  value: number;
  constructor(value: number) {
    super(TAG.REAL);
    this.value = value;
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.real(this);
  }
}
const real = (value: number) => new Real(value);

class Sym extends AlgebraicExpression {
  value: string;
  constructor(value: string) {
    super(TAG.SYM);
    this.value = value;
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.sym(this);
  }
}
const sym = (value: string) => (new Sym(value));

class Constant extends AlgebraicExpression {
  value: string;
  constructor(value: string) {
    super(TAG.CONSTANT);
    this.value = value;
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.constant(this);
  }
}
const constant = (value: string) => (new Constant(value));
const Undefined = constant("Undefined");

interface Compound {
  operator: string;
  operands: AlgebraicExpression[];
  kind: TAG;
}

class Rational extends AlgebraicExpression implements Compound {
  operator: "frac" = "frac";
  operands: [Int, Int];
  constructor(numerator: Int, denominator: Int) {
    super(TAG.RATIONAL);
    this.operands = [numerator, denominator];
  }
  get numerator() {
    return this.operands[0];
  }
  get denominator() {
    return this.operands[1];
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.rat(this);
  }
}

const rat = (numerator: number | Int, denominator: number | Int) => (
  new Rational(
    isNumber(numerator) ? int(numerator) : numerator,
    isNumber(denominator) ? int(denominator) : denominator,
  )
);

class Sum extends AlgebraicExpression implements Compound {
  operator: "+" = "+";
  operands: AlgebraicExpression[];
  constructor(operands: AlgebraicExpression[]) {
    super(TAG.SUM);
    this.operands = operands;
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.sum(this);
  }
}
const sum = (...operands: AlgebraicExpression[]) => (
  new Sum(operands)
);

class Product extends AlgebraicExpression implements Compound {
  operator: "*" = "*";
  operands: AlgebraicExpression[];
  constructor(operands: AlgebraicExpression[]) {
    super(TAG.PRODUCT);
    this.operands = operands;
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.product(this);
  }
}
const product = (...operands: AlgebraicExpression[]) => (
  new Product(operands)
);
const negation = (operand: AlgebraicExpression) => (
  product(int(-1), operand)
);
const difference = (left: AlgebraicExpression, right: AlgebraicExpression) => (
  sum(left, negation(right))
);

class Power extends AlgebraicExpression implements Compound {
  operator: "^" = "^";
  operands: AlgebraicExpression[];
  constructor(base: AlgebraicExpression, exponent: AlgebraicExpression) {
    super(TAG.POWER);
    this.operands = [base, exponent];
  }
  get base() {
    return this.operands[0];
  }
  get exponent() {
    return this.operands[1];
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.power(this);
  }
}
const power = (base: AlgebraicExpression, exponent: AlgebraicExpression) => (
  new Power(base, exponent)
);

class Quotient extends AlgebraicExpression implements Compound {
  operator: "/" = "/";
  operands: [AlgebraicExpression, AlgebraicExpression];
  constructor(dividend: AlgebraicExpression, divisor: AlgebraicExpression) {
    super(TAG.QUOTIENT);
    this.operands = [dividend, divisor];
  }
  get dividend() {
    return this.operands[0];
  }
  get divisor() {
    return this.operands[1];
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.quotient(this);
  }
}
const quotient = (
  dividend: AlgebraicExpression,
  divisor: AlgebraicExpression,
) => (
  new Quotient(dividend, divisor)
);

class Factorial extends AlgebraicExpression implements Compound {
  operator: "!" = "!";
  operands: [AlgebraicExpression];
  constructor(operand: AlgebraicExpression) {
    super(TAG.FACTORIAL);
    this.operands = [operand];
  }
  get arg() {
    return this.operands[0];
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.factorial(this);
  }
}
const factorial = (operand: AlgebraicExpression) => (
  new Factorial(operand)
);

class FunctionForm extends AlgebraicExpression implements Compound {
  operator: string;
  operands: AlgebraicExpression[];
  constructor(operator: string, operands: AlgebraicExpression[]) {
    super(TAG.FUNCTION_FORM);
    this.operator = operator;
    this.operands = operands;
  }
  acceptExprVisitor<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.functionForm(this);
  }
}

const fun = (operator: string, args: AlgebraicExpression[]) => (
  new FunctionForm(operator, args)
);

class IsCompound implements ExpressionVisitor<boolean> {
  int(expr: Int): boolean {
    return false;
  }
  real(expr: Real): boolean {
    return false;
  }
  sym(expr: Sym): boolean {
    return false;
  }
  rat(expr: Rational): boolean {
    return true;
  }
  constant(expr: Constant): boolean {
    return false;
  }
  sum(expr: Sum): boolean {
    return true;
  }
  product(expr: Product): boolean {
    return true;
  }
  power(expr: Power): boolean {
    return true;
  }
  quotient(expr: Quotient): boolean {
    return true;
  }
  factorial(expr: Factorial): boolean {
    return true;
  }
  functionForm(expr: FunctionForm): boolean {
    return true;
  }
  lessThan(expr: LessThan): boolean {
    return true;
  }
  greaterThan(expr: GreaterThan): boolean {
    return true;
  }
  equation(expr: Equation): boolean {
    return true;
  }
  nonEquation(expr: NonEquation): boolean {
    return true;
  }
  lessThanOrEqualTo(expr: LessThanOrEqualTo): boolean {
    return true;
  }
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): boolean {
    return true;
  }
  notExpression(expr: NotExpression): boolean {
    return true;
  }
  andExpression(expr: AndExpression): boolean {
    return true;
  }
  orExpression(expr: OrExpression): boolean {
    return true;
  }
}
const IS_COMPOUND = new IsCompound();
const isCompound = (expr: Expression) => (
  expr.acceptExprVisitor(IS_COMPOUND)
);

class ToString implements ExpressionVisitor<string> {
  stringify(expr: Expression) {
    return expr.acceptExprVisitor(this);
  }
  int(expr: Int): string {
    return (expr.parenLevel) ? `(${expr.value})` : `${expr.value}`;
  }
  real(expr: Real): string {
    return (expr.parenLevel) ? `(${expr.value})` : `${expr.value}`;
  }
  sym(expr: Sym): string {
    return (expr.parenLevel) ? `(${expr.value})` : `${expr.value}`;
  }
  rat(expr: Rational): string {
    const A = `${expr.numerator.value}`;
    const B = `${expr.denominator.value}`;
    const out = `${A}/${B}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  constant(expr: Constant): string {
    return (expr.parenLevel) ? `(${expr.value})` : `${expr.value}`;
  }
  private stringifyList(separator: string, args: Expression[]) {
    let out = "";
    for (let i = 0; i < args.length; i++) {
      const operand = this.stringify(args[i]);
      out += operand;
      if (i !== args.length - 1) {
        out += separator;
      }
    }
    return out;
  }
  sum(expr: Sum): string {
    const out = this.stringifyList("+", expr.operands);
    return expr.parenLevel ? `(${out})` : out;
  }
  product(expr: Product): string {
    const out = this.stringifyList("*", expr.operands);
    return expr.parenLevel ? `(${out})` : out;
  }
  power(expr: Power): string {
    const base = this.stringify(expr.base);
    const exponent = this.stringify(expr.exponent);
    const out = `${base}^${exponent}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  quotient(expr: Quotient): string {
    const dividend = this.stringify(expr.dividend);
    const divisor = this.stringify(expr.divisor);
    const out = `${dividend}/${divisor}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  factorial(expr: Factorial): string {
    const arg = this.stringify(expr.arg);
    const out = `${arg}!`;
    return expr.parenLevel ? `(${out})` : out;
  }
  functionForm(expr: FunctionForm): string {
    const name = expr.operator;
    const args = this.stringifyList(",", expr.operands);
    const out = `${name}(${args})`;
    return expr.parenLevel ? `(${out})` : out;
  }
  lessThan(expr: LessThan): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} < ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  greaterThan(expr: GreaterThan): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} > ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  equation(expr: Equation): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} = ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  nonEquation(expr: NonEquation): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} != ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  lessThanOrEqualTo(expr: LessThanOrEqualTo): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} <= ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} >= ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  notExpression(expr: NotExpression): string {
    const arg = this.stringify(expr.arg);
    const out = `not ${arg}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  andExpression(expr: AndExpression): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} and ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
  orExpression(expr: OrExpression): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} or ${right}`;
    return expr.parenLevel ? `(${out})` : out;
  }
}

const TO_STRING = new ToString();
const stringify = (u: Expression) => (
  u.acceptExprVisitor(TO_STRING)
);

class OperandCount implements ExpressionVisitor<number> {
  int(expr: Int): number {
    return 0;
  }
  real(expr: Real): number {
    return 0;
  }
  sym(expr: Sym): number {
    return 0;
  }
  rat(expr: Rational): number {
    return 2;
  }
  constant(expr: Constant): number {
    return 0;
  }
  sum(expr: Sum): number {
    return expr.operands.length;
  }
  product(expr: Product): number {
    return expr.operands.length;
  }
  power(expr: Power): number {
    return 2;
  }
  quotient(expr: Quotient): number {
    return 2;
  }
  factorial(expr: Factorial): number {
    return 1;
  }
  functionForm(expr: FunctionForm): number {
    return expr.operands.length;
  }
  lessThan(expr: LessThan): number {
    return 2;
  }
  greaterThan(expr: GreaterThan): number {
    return 2;
  }
  equation(expr: Equation): number {
    return 2;
  }
  nonEquation(expr: NonEquation): number {
    return 2;
  }
  lessThanOrEqualTo(expr: LessThanOrEqualTo): number {
    return 2;
  }
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): number {
    return 2;
  }
  notExpression(expr: NotExpression): number {
    return 1;
  }
  andExpression(expr: AndExpression): number {
    return 2;
  }
  orExpression(expr: OrExpression): number {
    return 2;
  }
}
const OPERAND_COUNT = new OperandCount();
const operandCount = (u: Expression) => (
  u.acceptExprVisitor(OPERAND_COUNT)
);

class OperandAt implements ExpressionVisitor<Expression> {
  index: number;
  constructor(index: number) {
    this.index = index - 1;
  }
  int(expr: Int): Expression {
    return Undefined;
  }
  real(expr: Real): Expression {
    return Undefined;
  }
  sym(expr: Sym): Expression {
    return Undefined;
  }
  rat(expr: Rational): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  constant(expr: Constant): Expression {
    return Undefined;
  }
  sum(expr: Sum): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  product(expr: Product): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  power(expr: Power): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  quotient(expr: Quotient): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  factorial(expr: Factorial): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  functionForm(expr: FunctionForm): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  lessThan(expr: LessThan): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  greaterThan(expr: GreaterThan): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  equation(expr: Equation): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  nonEquation(expr: NonEquation): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  lessThanOrEqualTo(expr: LessThanOrEqualTo): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  notExpression(expr: NotExpression): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  andExpression(expr: AndExpression): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
  orExpression(expr: OrExpression): Expression {
    const out = expr.operands[this.index];
    return out === undefined ? Undefined : out;
  }
}

const operand = (expr: Expression, at: number) => (
  expr.acceptExprVisitor(new OperandAt(at))
);

const subexOf = (u: Expression) => {
  if (
    u.kind === TAG.INT ||
    u.kind === TAG.REAL ||
    u.kind === TAG.SYM ||
    u.kind === TAG.RATIONAL
  ) {
    return set(stringify(u));
  } else {
    let s = set(stringify(u));
    for (let i = 1; i < operandCount(u); i++) {
      s = s.union(subexOf(operand(u, i)));
    }
    return s;
  }
};

// deno-fmt-ignore
enum TokenType {
  left_paren, right_paren, left_brace, right_brace, left_bracket, right_bracket,
  comma, dot, minus, plus, colon, colon_equal, semicolon,
  slash, star, bang, bang_equal, equal, greater_equal,
  less, less_equal, identifier, string, number, and,
  class, else, false, fn, for, if, nil, or,
  print, return, super, this, true, var, while
}


