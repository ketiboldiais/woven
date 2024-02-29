import {
  Either,
  isDigit,
  isLatinGreek,
  left,
  Right,
  right,
  treed,
} from "./aux";
import { BP } from './bp';
import { show } from "./aux";

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

const set = (data: (string | number)[]) => (
  new SetX(data)
);

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

abstract class Stmt extends Evaluator {}

abstract class Expression extends Evaluator {
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

const isAlgebraic = (u: Expression): u is AlgebraicExpression => (
  u instanceof AlgebraicExpression
);

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

const isInt = (u: Expression): u is Int => (
  u.kind === TAG.INT
);

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

const isReal = (u: Expression): u is Real => (
  u.kind === TAG.REAL
);

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

const isSym = (u: Expression): u is Sym => (
  u.kind === TAG.SYM
);

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

const isConstant = (u: Expression): u is Constant => (
  u.kind === TAG.CONSTANT
);

const isUndefined = (u: Expression) => (
  isConstant(u) && u.value === "Undefined"
);

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

const isRational = (u: Expression): u is Rational => (
  u.kind === TAG.RATIONAL
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

const sum = (operands: AlgebraicExpression[]) => (
  new Sum(operands)
);

const isSum = (u: Expression): u is Sum => (
  u.kind === TAG.SUM
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

const product = (operands: AlgebraicExpression[]) => (
  new Product(operands)
);

const isProduct = (u: Expression): u is Product => (
  u.kind === TAG.PRODUCT
);

const negation = (operand: AlgebraicExpression) => (
  product([int(-1), operand])
);

const difference = (left: AlgebraicExpression, right: AlgebraicExpression) => (
  sum([left, negation(right)])
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

const isPower = (u: Expression): u is Power => (
  u.kind === TAG.POWER
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
const isQuotient = (u: Expression): u is Quotient => (
  u.kind === TAG.QUOTIENT
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

const isFactorial = (u: Expression): u is Factorial => (
  u.kind === TAG.FACTORIAL
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

const isFunctionForm = (u: Expression): u is FunctionForm => (
  u.kind === TAG.FUNCTION_FORM
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

class EqualExpressions implements ExpressionVisitor<boolean> {
  expr: Expression;
  constructor(expr: Expression) {
    this.expr = expr;
  }
  int(expr: Int): boolean {
    if (isInt(this.expr)) {
      return this.expr.value === expr.value;
    } else {
      return false;
    }
  }
  real(expr: Real): boolean {
    if (isReal(this.expr)) {
      return this.expr.value === expr.value;
    } else {
      return false;
    }
  }
  sym(expr: Sym): boolean {
    if (isSym(this.expr)) {
      return this.expr.value === expr.value;
    } else {
      return false;
    }
  }
  rat(expr: Rational): boolean {
    throw new Error("Method not implemented.");
  }
  constant(expr: Constant): boolean {
    throw new Error("Method not implemented.");
  }
  sum(expr: Sum): boolean {
    throw new Error("Method not implemented.");
  }
  product(expr: Product): boolean {
    throw new Error("Method not implemented.");
  }
  power(expr: Power): boolean {
    throw new Error("Method not implemented.");
  }
  quotient(expr: Quotient): boolean {
    throw new Error("Method not implemented.");
  }
  factorial(expr: Factorial): boolean {
    throw new Error("Method not implemented.");
  }
  functionForm(expr: FunctionForm): boolean {
    throw new Error("Method not implemented.");
  }
  lessThan(expr: LessThan): boolean {
    throw new Error("Method not implemented.");
  }
  greaterThan(expr: GreaterThan): boolean {
    throw new Error("Method not implemented.");
  }
  equation(expr: Equation): boolean {
    throw new Error("Method not implemented.");
  }
  nonEquation(expr: NonEquation): boolean {
    throw new Error("Method not implemented.");
  }
  lessThanOrEqualTo(expr: LessThanOrEqualTo): boolean {
    throw new Error("Method not implemented.");
  }
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): boolean {
    throw new Error("Method not implemented.");
  }
  notExpression(expr: NotExpression): boolean {
    throw new Error("Method not implemented.");
  }
  andExpression(expr: AndExpression): boolean {
    throw new Error("Method not implemented.");
  }
  orExpression(expr: OrExpression): boolean {
    throw new Error("Method not implemented.");
  }
}

class ToString implements ExpressionVisitor<string> {
  stringify(expr: Expression) {
    return expr.acceptExprVisitor(this);
  }
  int(expr: Int): string {
    return `${expr.value}`;
  }
  real(expr: Real): string {
    return `${expr.value}`;
  }
  sym(expr: Sym): string {
    return `${expr.value}`;
  }
  rat(expr: Rational): string {
    const A = `${expr.numerator.value}`;
    const B = `${expr.denominator.value}`;
    const out = `${A}/${B}`;
    return out;
  }
  constant(expr: Constant): string {
    return `${expr.value}`;
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
    const args = expr.operands;
    const summands: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const operand = this.stringify(args[i]);
      summands.push(operand);
    }
    const out = summands.join("+").replaceAll("+-", "-");
    return out;
  }
  product(expr: Product): string {
    if (expr.operands.length === 2) {
      const lhs = expr.operands[0];
      const rhs = expr.operands[1];
      if (isInt(lhs) && lhs.value === -1) {
        return `-${toString(rhs)}`;
      }
      if (
        (isInt(lhs) && isSym(rhs)) ||
        (isReal(lhs) && isSym(rhs)) ||
        (isInt(lhs) && isFunctionForm(rhs)) ||
        (isReal(lhs) && isFunctionForm(rhs)) ||
        (isInt(lhs) &&
          (isPower(rhs) && (isSym(rhs.base) || isFunctionForm(rhs.base)))) ||
        (isReal(lhs) &&
          (isPower(rhs) && (isSym(rhs.base) || isFunctionForm(rhs.base))))
      ) {
        return `${toString(lhs)}${toString(rhs)}`;
      }
    }
    const out = this.stringifyList("*", expr.operands);
    return out;
  }
  power(expr: Power): string {
    const base = this.stringify(expr.base);
    const exponent = this.stringify(expr.exponent);
    const out = `${base}^${exponent}`;
    return out;
  }
  quotient(expr: Quotient): string {
    const dividend = this.stringify(expr.dividend);
    const divisor = this.stringify(expr.divisor);
    const out = `${dividend}/${divisor}`;
    return out;
  }
  factorial(expr: Factorial): string {
    const arg = this.stringify(expr.arg);
    const out = `${arg}!`;
    return out;
  }
  functionForm(expr: FunctionForm): string {
    const name = expr.operator;
    const args = this.stringifyList(",", expr.operands);
    const out = `${name}(${args})`;
    return out;
  }
  lessThan(expr: LessThan): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} < ${right}`;
    return out;
  }
  greaterThan(expr: GreaterThan): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} > ${right}`;
    return out;
  }
  equation(expr: Equation): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} = ${right}`;
    return out;
  }
  nonEquation(expr: NonEquation): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} != ${right}`;
    return out;
  }
  lessThanOrEqualTo(expr: LessThanOrEqualTo): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} <= ${right}`;
    return out;
  }
  greaterThanOrEqualTo(expr: GreaterThanOrEqualTo): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} >= ${right}`;
    return out;
  }
  notExpression(expr: NotExpression): string {
    const arg = this.stringify(expr.arg);
    const out = `not ${arg}`;
    return out;
  }
  andExpression(expr: AndExpression): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} and ${right}`;
    return out;
  }
  orExpression(expr: OrExpression): string {
    const left = this.stringify(expr.operands[0]);
    const right = this.stringify(expr.operands[1]);
    const out = `${left} or ${right}`;
    return out;
  }
}

const TO_STRING = new ToString();

/**
 * Returns the expression `u` as a string.
 */
const toString = (u: Expression) => (
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

/**
 * Given the expression `u`, returns the number
 * of operands of `u`. If `u` is not a compound
 * expression, returns `0`.
 */
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

/**
 * Returns the operand of the expression
 * `u` at the given `index`. This function
 * assumes that `u` is a compound expression.
 * If `u` is not a compound expression, or if
 * the `index` is out of bounds, returns
 * the global symbol `Undefined`.
 */
const operand = (u: Expression, index: number) => (
  u.acceptExprVisitor(new OperandAt(index))
);

/**
 * Returns a set comprising the subexpressions of
 * the given expression `u`.
 */
const subexOf = (u: Expression) => {
  if (
    u.kind === TAG.INT ||
    u.kind === TAG.REAL ||
    u.kind === TAG.SYM ||
    u.kind === TAG.RATIONAL
  ) {
    return set([toString(u)]);
  } else {
    let s = set([toString(u)]);
    for (let i = 1; i <= operandCount(u); i++) {
      s = s.union(subexOf(operand(u, i)));
    }
    return s;
  }
};

/**
 * Returns true if the expression `u` does not
 * contain the expression `t`. Returns false
 * otherwise.
 */
const freeof = (u: Expression, t: Expression) => {
  const U = toString(u);
  const T = toString(t);
  if (U === T) {
    return false;
  } else if (
    u.kind === TAG.SYM ||
    u.kind === TAG.INT ||
    u.kind === TAG.REAL
  ) {
    return true;
  } else {
    let i = 1;
    while (i <= operandCount(u)) {
      if (!freeof(operand(u, i), t)) {
        return false;
      }
      i = i + 1;
    }
    return true;
  }
};

/**
 * An enum corresponding to the token types
 * generated by the scanner.
 */
// deno-fmt-ignore
enum TokenType {
  left_paren, right_paren, left_brace, right_brace,
	left_bracket, right_bracket, comma, dot,
  minus, caret, plus, slash, star,
  bang, bang_equal, equal, greater, greater_equal,
  less, less_equal, identifier, string, int,
  float, rational, fnForm,
	EOF, EMPTY,
}

class ERROR extends Error {
  constructor(message: string) {
    super(message);
  }
}

const error = (message: string) => (
  new ERROR(message)
);

class Token {
  type: TokenType;
  lexeme: string;
  constructor(type: TokenType, lexeme: string) {
    this.type = type;
    this.lexeme = lexeme;
  }
}

const token = (type: TokenType, lexeme: string) => (
  new Token(type, lexeme)
);

const lexemesOf = (code: string) => {
  const keywords: Record<string, TokenType> = {};
  const functions: SetX = set([
    "sin",
    "cos",
    "tan",
  ]);
  let $source = code;
  let $tokens: Token[] = [];
  let $start = 0;
  let $current = 0;
  let $error: null | ERROR = null;
  const atEnd = () => $current >= $source.length;
  const advance = () => $source.charAt($current++);
  const peek = () => {
    if (atEnd()) return "";
    return $source.charAt($current);
  };
  const peekNext = () => {
    if ($current + 1 >= $source.length) {
      return "";
    }
    return $source.charAt($current + 1);
  };
  const match = (expectedChar: string) => {
    if (atEnd()) return false;
    if ($source.charAt($current) !== expectedChar) return false;
    $current++;
    return true;
  };
  const addToken = (type: TokenType) => {
    const text = $source.substring($start, $current);
    $tokens.push(token(type, text));
  };

  const identifier = () => {
    while (isLatinGreek(peek())) {
      advance();
    }
    const text = $source.substring($start, $current);
    let type = TokenType.identifier;
    if (keywords[text]) {
      type = keywords[text];
    }
    if (functions.has(text)) {
      type = TokenType.fnForm;
    }
    addToken(type);
  };

  const number = () => {
    let type: TokenType.int | TokenType.float | TokenType.rational =
      TokenType.int;
    while (isDigit(peek())) {
      advance();
    }
    if (peek() === "." && isDigit(peekNext())) {
      advance();
      type = TokenType.float;
      while (isDigit(peek())) {
        advance();
      }
    }
    if (peek() === "/" && peekNext() === "/") {
      if (type !== TokenType.int) {
        $error = error(`Expected an integer before “//”`);
      }
      type = TokenType.rational;
      advance();
      advance();
      while (isDigit(peek())) {
        advance();
      }
    }
    addToken(type);
  };

  const scanToken = () => {
    const char = advance();
    switch (char) {
      case "(":
        addToken(TokenType.left_paren);
        break;
      case ")":
        addToken(TokenType.right_paren);
        break;
      case "{":
        addToken(TokenType.left_brace);
        break;
      case "}":
        addToken(TokenType.right_brace);
        break;
      case "^":
        addToken(TokenType.caret);
        break;
      case ",":
        addToken(TokenType.comma);
        break;
      case ".":
        addToken(TokenType.dot);
        break;
      case "-":
        addToken(TokenType.minus);
        break;
      case "+":
        addToken(TokenType.plus);
        break;
      case "/":
        addToken(TokenType.slash);
        break;
      case "*":
        addToken(TokenType.star);
        break;
      case "!":
        addToken(match("=") ? TokenType.bang_equal : TokenType.bang);
        break;
      case "=":
        addToken(TokenType.equal);
        break;
      case "<":
        addToken(match("=") ? TokenType.less_equal : TokenType.less);
        break;
      case ">":
        addToken(match("=") ? TokenType.greater_equal : TokenType.greater);
        break;
      case " ":
      case "\r":
      case "\t":
      case "\n":
        break;
      default:
        if (isDigit(char)) {
          number();
        } else if (isLatinGreek(char)) {
          identifier();
        } else {
          $error = error(`Unknown token: “${char}”`);
        }
        break;
    }
  };
  const scanTokens = () => {
    while (!atEnd()) {
      $start = $current;
      scanToken();
      if ($error) {
        return left($error);
      }
    }
    $tokens.push(token(TokenType.EOF, "EOF"));
    return right($tokens);
  };
  return scanTokens();
};

type Parselet<T> = (token: Token, lastnode: T) => Either<ERROR, T>;

type ParseRuleTable<T> = Record<TokenType, [Parselet<T>, Parselet<T>, BP]>;

const syntax = (code: string) => {
  let $cursor = 0;
  let $current = token(TokenType.EMPTY, "");
  let $peek = token(TokenType.EMPTY, "");
  let $error: null | ERROR = null;
  let $tokens: Token[] = [];
  const atEnd = () => (
    $peek.type === TokenType.EOF ||
    $error !== null
  );
  const maybeTokens = lexemesOf(code);
  if (maybeTokens.isLeft()) {
    $error = maybeTokens.unwrap();
  } else {
    $tokens = maybeTokens.unwrap();
  }
  const next = () => {
    $current = $peek;
    const nextToken = $tokens[$cursor++];
    $peek = nextToken;
    return $current;
  };
  const failure = (message: string, phase: string) => {
    $error = error(`While ${phase}: ${message}`);
    return left($error);
  };
  const success = <T>(node: T) => (
    right(node)
  );
  const nextIs = (type: TokenType) => {
    if ($peek.type === type) {
      next();
      return true;
    }
    return false;
  };
  const check = (type: TokenType) => {
    if (atEnd()) {
      return false;
    } else {
      return $peek.type === type;
    }
  };

  const productExpr: Parselet<Expression> = (op, lhs) => {
    if (!isAlgebraic(lhs)) {
      return failure("Expected an algebraic expression", "parsing a product");
    }
    const _rhs = expr(precOf(op.type));
    if (_rhs.isLeft()) {
      return _rhs;
    }
    const rhs = _rhs.unwrap();
    if (!isAlgebraic(rhs)) {
      return failure("Expected an algebraic expression", "parsing a product");
    }
    const args = [];
    if (isProduct(lhs)) {
      args.push(...lhs.operands);
    } else {
      args.push(lhs);
    }
    if (isProduct(rhs)) {
      args.push(...rhs.operands);
    } else {
      args.push(rhs);
    }
    return success(product(args));
  };

  const sumExpr: Parselet<Expression> = (op, lhs) => {
    if (!isAlgebraic(lhs)) {
      return failure("Expected an algebraic expression", "parsing a sum");
    }
    const _rhs = expr(precOf(op.type));
    if (_rhs.isLeft()) {
      return _rhs;
    }
    const rhs = _rhs.unwrap();
    if (!isAlgebraic(rhs)) {
      return failure("Expected an algebraic expression", "parsing a sum");
    }
    const args = [];
    if (isSum(lhs)) {
      args.push(...lhs.operands);
    } else {
      args.push(lhs);
    }
    if (isSum(rhs)) {
      args.push(...rhs.operands);
    } else {
      args.push(rhs);
    }
    return success(sum(args));
  };

  const quotientExpr: Parselet<Expression> = (op, lhs) => {
    if (!isAlgebraic(lhs)) {
      return failure("Expected an algebraic expression", "parsing a quotient");
    }
    const _rhs = expr(precOf(op.type));
    if (_rhs.isLeft()) {
      return _rhs;
    }
    const rhs = _rhs.unwrap();
    if (!isAlgebraic(rhs)) {
      return failure("Expected an algebraic expression", "parsing a quotient");
    }
    return success(quotient(lhs, rhs));
  };

  const powerExpr: Parselet<Expression> = (op, lhs) => {
    if (!isAlgebraic(lhs)) {
      return failure("Expected an algebraic expression", "parsing a power");
    }
    const _rhs = expr(precOf(op.type));
    if (_rhs.isLeft()) {
      return _rhs;
    }
    const rhs = _rhs.unwrap();
    if (!isAlgebraic(rhs)) {
      return failure("Expected an algebraic expression", "parsing a power");
    }
    return success(power(lhs, rhs));
  };

  const differenceExpr: Parselet<Expression> = (op, lhs) => {
    if (!isAlgebraic(lhs)) {
      return failure(
        "Expected an algebraic expression",
        "parsing a difference",
      );
    }
    const _rhs = expr(precOf(op.type));
    if (_rhs.isLeft()) {
      return _rhs;
    }
    const rhs = _rhs.unwrap();
    if (!isAlgebraic(rhs)) {
      return failure(
        "Expected an algebraic expression",
        "parsing a difference",
      );
    }
    return success(difference(lhs, rhs));
  };

  const factorialExpr: Parselet<Expression> = (op, arg) => {
    if (!isAlgebraic(arg)) {
      return failure("Expected an algebraic expression", "parsing a factorial");
    }
    return success(factorial(arg));
  };

  const negate: Parselet<Expression> = (op) => {
    const p = precOf(op.type);
    const _arg = expr(p);
    if (_arg.isLeft()) return _arg;
    const arg = _arg.unwrap();
    if (!isAlgebraic(arg)) {
      return failure("Expected an algebraic expression", "parsing a negation");
    }
    return success(negation(arg));
  };

  const numeric = (
    tokenType: TokenType,
    errorMessage: [string, string],
    literalFn: (x: string) => Expression,
  ): Parselet<Expression> =>
  (token) => {
    if (token.type !== tokenType) {
      return failure(errorMessage[0], errorMessage[1]);
    } else {
      const out = literalFn(token.lexeme);
      if (
        $peek.type === TokenType.identifier ||
        $peek.type === TokenType.fnForm
      ) {
        const _rhs = expr(BP.IMUL);
        if (_rhs.isLeft()) {
          return _rhs;
        }
        const rhs = _rhs.unwrap();
        if (!isAlgebraic(rhs)) {
          return failure(
            "Expected an algebraic expression",
            "parsing an implicit multiplication triggered by a numeric",
          );
        }
        return success(product([out, rhs]));
      }
      return success(out);
    }
  };

  const float = numeric(
    TokenType.float,
    ["expected a float", "parsing a float"],
    (x) => real(Number.parseFloat(x)),
  );

  const integer = numeric(
    TokenType.int,
    ["expected an int", "parsing an int"],
    (x) => int(Number.parseInt(x)),
  );

  const identifier: Parselet<Expression> = (token) => {
    return success(sym(token.lexeme));
  };

  const rationalNumber: Parselet<Expression> = (token) => {
    const [a, b] = token.lexeme.split("//");
    const N = Number.parseInt(a);
    const D = Number.parseInt(b);
    return success(rat(N, D));
  };

  const exprList = <T extends Expression>(
    check: (u: Expression) => Either<ERROR, T>,
  ) => {
    const exprs: T[] = [];
    do {
      const _expression = expr();
      if (_expression.isLeft()) {
        return _expression;
      }
      const _element = check(_expression.unwrap());
      if (_element.isLeft()) {
        return _element;
      }
      exprs.push(_element.unwrap());
    } while (nextIs(TokenType.comma));
    return right(exprs);
  };

  const fcall: Parselet<Expression> = (token) => {
    const fname = token.lexeme;
    if (!nextIs(TokenType.left_paren)) {
      return failure(
        "Expected “(” to begin arguments",
        "parsing a function call",
      );
    }
    let arglist: AlgebraicExpression[] = [];
    if (!check(TokenType.right_paren)) {
      const _args = exprList((u) => {
        if (!isAlgebraic(u)) {
          return failure(
            "Expected an algebraic expression argument",
            "parsing a function call",
          );
        } else {
          return right(u) as Right<AlgebraicExpression>;
        }
      });
      if (_args.isLeft()) {
        return _args;
      } else {
        arglist = _args.unwrap();
      }
    }
    if (!nextIs(TokenType.right_paren)) {
      return failure(
        "Expected a “)” to close the arguments",
        "parsing a function call",
      );
    }
    return success(fun(fname, arglist));
  };

  const primary: Parselet<Expression> = () => {
    const _innerExpression = expr();
    if (_innerExpression.isLeft()) {
      return _innerExpression;
    }
    const innerExpression = _innerExpression.unwrap();
    if (!nextIs(TokenType.right_paren)) {
      return failure(
        "Expected a “)” to close the parenthesized expression",
        "parsing a parenthesized expression",
      );
    }
    return success(innerExpression);
  };

  const ___: Parselet<Expression> = (token) => (
    failure("expression", `unexpected token “${token.lexeme}”`)
  );

  const ___o = BP.NONE;

  const rules: ParseRuleTable<Expression> = {
    [TokenType.identifier]: [identifier, ___, BP.LITERAL],
    [TokenType.int]: [integer, ___, BP.LITERAL],
    [TokenType.float]: [float, ___, BP.LITERAL],
    [TokenType.rational]: [rationalNumber, ___, BP.LITERAL],
    [TokenType.caret]: [___, powerExpr, BP.POWER],
    [TokenType.plus]: [___, sumExpr, BP.SUM],
    [TokenType.minus]: [negate, differenceExpr, BP.DIFFERENCE],
    [TokenType.star]: [___, productExpr, BP.PRODUCT],
    [TokenType.slash]: [___, quotientExpr, BP.QUOTIENT],
    [TokenType.bang]: [___, factorialExpr, BP.POSTFIX],
    [TokenType.fnForm]: [fcall, ___, BP.CALL],
    [TokenType.left_paren]: [primary, ___, BP.CALL],
    [TokenType.right_paren]: [___, ___, ___o],

    [TokenType.left_brace]: [___, ___, ___o],
    [TokenType.right_brace]: [___, ___, ___o],
    [TokenType.left_bracket]: [___, ___, ___o],
    [TokenType.right_bracket]: [___, ___, ___o],
    [TokenType.comma]: [___, ___, ___o],
    [TokenType.dot]: [___, ___, ___o],
    [TokenType.bang_equal]: [___, ___, ___o],
    [TokenType.equal]: [___, ___, ___o],
    [TokenType.greater]: [___, ___, ___o],
    [TokenType.greater_equal]: [___, ___, ___o],
    [TokenType.less]: [___, ___, ___o],
    [TokenType.less_equal]: [___, ___, ___o],
    [TokenType.string]: [___, ___, ___o],
    [TokenType.EOF]: [___, ___, ___o],
    [TokenType.EMPTY]: [___, ___, ___o],
  };
  const prefixRule = (type: TokenType) => rules[type][0];
  const infixRule = (type: TokenType) => rules[type][1];
  const precOf = (type: TokenType) => rules[type][2];

  const expr = (minBP: BP = BP.LOWEST) => {
    let token = next();
    const prefix = prefixRule(token.type);
    let lhs = prefix(token, Undefined);
    if (lhs.isLeft()) {
      return lhs;
    }
    while (minBP < precOf($peek.type)) {
      if (atEnd()) {
        break;
      }
      token = next();
      const infix = infixRule(token.type);
      const rhs = infix(token, lhs.unwrap());
      if (rhs.isLeft()) {
        return rhs;
      }
      lhs = rhs;
    }
    return lhs;
  };

  const run = () => {
    next();
    return expr();
  };
  return run();
};

const expr = (code: string) => {
  const out = syntax(code);
  if (out.isLeft()) {
    return Undefined;
  }
  return out.unwrap();
};

const order = (u: Expression, v: Expression) => {
};

const j = expr(`2x^3 + 4x^2 - 5`);
show(treed(j));
