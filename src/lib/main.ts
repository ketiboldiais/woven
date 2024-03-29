// ============================================================ Pretty-printer
/**
 * Returns a pretty-print string of the
 * given object.
 */
export const treed = (obj: Object) => {
  const makePrefix = (key: string, last: boolean) => {
    let str = last ? "└" : "├";
    str += key ? "─ " : "──┐";
    return str;
  };
  const filterKeys = (obj: Object, hideFunctions: boolean) => {
    const keys = [];
    for (var branch in obj) {
      if (!obj.hasOwnProperty(branch)) {
        continue;
      }
      // @ts-ignore
      if (hideFunctions && ((typeof obj[branch]) === "function")) {
        continue;
      }
      keys.push(branch);
    }
    return keys;
  };
  const growBranch = (
    key: string,
    root: Object,
    last: boolean,
    lastStates: ([Object, boolean])[],
    showValues: boolean,
    hideFunctions: boolean,
    callback: (L: string) => void,
  ) => {
    let line = "",
      index = 0,
      lastKey,
      // @ts-ignore
      circular,
      lastStatesCopy = lastStates.slice(0);

    if (lastStatesCopy.push([root, last]) && lastStates.length > 0) {
      lastStates.forEach(function (lastState, idx) {
        if (idx > 0) {
          line += (lastState[1] ? " " : "│") + "  ";
        }
        // @ts-ignore
        if (!circular && lastState[0] === root) {
          circular = true;
        }
      });
      line += makePrefix(key, last) + key;
      if (showValues && typeof root !== "object") {
        line += ": " + root;
      }
      circular && (line += " (circular ref.)");
      callback(line);
    }

    if (!circular && typeof root === "object") {
      let keys = filterKeys(root, hideFunctions);
      keys.forEach(function (branch) {
        lastKey = ++index === keys.length;
        growBranch(
          branch,
          // @ts-ignore
          root[branch],
          lastKey,
          lastStatesCopy,
          showValues,
          hideFunctions,
          callback,
        );
      });
    }
  };
  const str = () => {
    let tree = "";
    growBranch(
      ".",
      obj,
      false,
      [],
      true,
      true,
      (line) => tree += line + "\n",
    );
    return tree;
  };
  return str();
};

/**
 * Logs the given `x` to the console.
 */
export const show = (x: any) => {
  if (Array.isArray(x)) {
    console.log(x);
  } else if (typeof x === "object") {
    console.log(treed(x));
  } else {
    console.log(x);
  }
  return x;
};

// ===================================================================== Typings
/**
 * Returns true if the given `x` is a JavaScript number,
 * false otherwise. This function will return false if `x` is
 * `NaN`.
 */
export const isJSNum = (x: any): x is number => (
  typeof x === "number" && !Number.isNaN(x)
);

/**
 * Returns true if the given `x` is a JavaScript number,
 * and more specifically, an integer.
 */
export const isJSInt = (n: any): n is number => (
  isJSNum(n) && (Number.isInteger(n))
);

/** A box type corresponding to failure. */
export class Left<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }
  map<A>(f: (x: never) => A): Either<T, never> {
    return this as any;
  }
  isLeft(): this is Left<T> {
    return true;
  }
  isRight(): this is never {
    return false;
  }
  chain<X, S>(f: (x: never) => Either<X, S>): Left<T> {
    return this;
  }
  read<K>(value: K): K {
    return value;
  }
  flatten(): Left<T> {
    return this;
  }
  unwrap() {
    return this.value;
  }
  ap<B, E>(f: Either<T, E>): Either<never, B> {
    return this as any;
  }
}

/** A box type corresponding success. */
export class Right<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }
  map<X>(f: (x: T) => X): Either<never, X> {
    return new Right(f(this.value));
  }
  isLeft(): this is never {
    return false;
  }
  isRight(): this is Right<T> {
    return true;
  }
  chain<N, X>(f: (x: T) => Either<N, X>): Either<never, X> {
    return f(this.value) as Either<never, X>;
  }
  flatten(): Right<(T extends Right<(infer T)> ? T : never)> {
    return ((this.value instanceof Right ||
        this.value instanceof Left)
      ? this.value
      : this) as Right<(T extends Right<(infer T)> ? T : never)>;
  }
  read<K>(_: K): T {
    return this.value;
  }
  unwrap() {
    return this.value;
  }
  ap<B, E>(f: Either<E, (x: T) => B>): Either<never, B> {
    if (f.isLeft()) return f as any as Right<B>;
    return this.map(f.value);
  }
}

/** Returns a new left. */
export const left = <T>(x: T): Left<T> => new Left(x);

/** Returns a new right. */
export const right = <T>(x: T): Right<T> => new Right(x);

/**
 * A type corresponding to “either generic type `A`
 * or generic type `B`.”
 */
export type Either<A, B> = Left<A> | Right<B>;

/** A mixin type alias. */
type Constructor<T = {}> = new (...args: any[]) => T;

/** An alias for a mixin of classes `A` and `B`. */
type MixOf<A, B> = A & Constructor<B>;

// ================================================================== Set Theory

/** Returns a tuple. */
export const tuple = <T extends any[]>(...data: T) => data;

// ============================================================ Numeric Analysis
/**
 * The value of the largest integer n such that
 * n and n + 1 are both exactly
 * representable as a Number value (i.e.,
 * `9,007,199,254,740,991`).
 */
export const MAX_INT = Number.MAX_SAFE_INTEGER;
/**
 * The largest number that can be represented
 * in JavaScript (approx. `1.79E+308`).
 */
export const MAX_FLOAT = Number.MAX_VALUE;
/**
 * Returns the number between `x` and `y` at the specified increment `a`.
 */
export const lerp = (interval: [number, number], inc: number) => (
  interval[0] * (1 - inc) + interval[1] * inc
);

/**
 * Clamps the given `value` between the `leastPossibleValue` and
 * the `greatestPossibleValue`.
 */
export const clamp = (
  leastPossibleValue: number,
  value: number,
  greatestPossibleValue: number,
) => (
  Math.min(greatestPossibleValue, Math.max(leastPossibleValue, value))
);

/**
 * Where `I` is the interval `[a,b]`,
 * the "inverse lerp" returns the distance
 * between `v` and `a`, in terms of the
 * percentage (a decimal between 0 and 1, inclusive) of the
 * distance between `a` and `b`.
 */
export const ilerp = (I: [number, number], v: number) => (
  clamp(0, (v - I[0]) / (I[1] - I[0]), 1)
);

/**
 * Given the intervals `interval1` and `interval2`, returns a function
 * that, given a `value` within `interval1`, returns the
 * corresponding number in `interval2` at the same percentage of
 * the distance between the `interval2` endpoints.
 */
// deno-fmt-ignore
export const range = (
  interval1: [number, number], 
  interval2: [number, number]
) => (
  value: number,
) => lerp(interval2, ilerp(interval1, value));

/** Returns a% of b. */
export const percent = (a: number, b: number) => ((a / 100) * b);

/** A utility method that generates a pseudorandom string. @param length - The max length of the resulting string. @param base - The base from which to draw characters. */
export const uid = (length: number = 4, base = 36) => (
  Math.random()
    .toString(base)
    .replace(/[^a-z]+/g, "")
    .substring(0, length + 1)
);

// =============================================================== Number Theory

/** Returns the integer remainder of `a` and `b`. */
export const rem = (a: number, b: number) => {
  a = Math.floor(a);
  b = Math.floor(b);
  return ((a % b) + b) % b;
};

/** Returns `a rem b` (the signed remainder). */
export const mod = (a: number, b: number) => (a % b);

/** Returns the integer quotient of `a` and `b`. */
export const quot = (a: number, b: number) => {
  a = Math.floor(a);
  b = Math.floor(b);
  return Math.floor(a / b);
};

/** Returns the greatest common denominator of `a` and `b`. */
export const gcd = (a: number, b: number) => {
  a = Math.floor(a);
  b = Math.floor(b);
  if (b === 0) {
    return Math.abs(a);
  }
  let A = a;
  let B = b;
  while (B !== 0) {
    let R = rem(A, B);
    A = B;
    B = R;
  }
  return Math.abs(A);
};

/**
 * Where `q` corresponds to the rational
 * `n/d`, returns `n/d` in standard form (i.e.,
 * n/d in “simplest” terms). If `d = 0`, returns
 * `fraction`.
 */
export const sfrac = (q: [number, number]): [number, number] => {
  const [n, d] = q;
  if (d === 1) {
    return q;
  } else if (d === 0) {
    return q;
  } else {
    if (rem(n, d) === 0) {
      return [quot(n, d), 1];
    } else {
      const g = gcd(n, d);
      if (d > 0) {
        return [quot(n, g), quot(d, g)];
      } else {
        return [quot(-n, g), quot(-d, g)];
      }
    }
  }
};

// revisit this after considering whether to allow bigints
/** Returns the factorial of the given number. */
export const fact = (n: number) => {
  if (n === 0 || n === 1) {
    return 1;
  }
  for (var i = n - 1; i >= 1; i--) {
    n *= i;
  }
  return n;
};

/** Returns true if the given number is even. */
export const isEven = (n: number) => (
  (n % 2) === 0
);

/** Returns true if the given number is odd. */
export const isOdd = (n: number) => (!isEven(n));

// ===================================================== Trigonometric Functions

/** Returns the secant of `x`. */
export const sec = (x: number) => (1 / Math.cos(x));

/** Returns the cosecant of `x`. */
export const csc = (x: number) => (1 / Math.sin(x));

// ============================================================== Linear Algebra

export enum BP {
  NONE,
  LOWEST,
  STRINGOP,
  ASSIGN,
  LITERAL,
  OR,
  NOR,
  AND,
  NAND,
  XOR,
  XNOR,
  NOT,
  EQUALITY,
  RELATION,
  SUM,
  DIFFERENCE,
  PRODUCT,
  QUOTIENT,
  IMUL,
  POWER,
  POSTFIX,
  CALL,
}

/** An object corresponding to a scientific number. */
class Scinum {
  $base: number;
  $exponent: number;
  constructor(base: number, exponent: number) {
    this.$base = base;
    this.$exponent = exponent;
  }
}

/** Returns a new scientific number. */
const scinum = (base: number, exponent: number) => (
  new Scinum(base, exponent)
);

/** A vector in R^3. */
class Vector3 {
  $x: number;
  $y: number;
  $z: number;
  constructor(x: number, y: number, z: number) {
    this.$x = x;
    this.$y = y;
    this.$z = z;
  }
  /**
   * Returns a new Vector3 corresponding to this
   * Vector3 negated.
   */
  neg() {
    return new Vector3(
      -this.$x,
      -this.$y,
      -this.$z
    )
  }
  /**
   * Returns a new Vector3 corresponding to the
   * sum of this vector and the provided vector.
   */
  add(vector3: Vector3) {
    return new Vector3(
      this.$x + vector3.$x,
      this.$y + vector3.$y,
      this.$z + vector3.$z,
    );
  }

  /**
   * Returns a new Vector3 corresponding to
   * the sum of this vector and the provided vector.
   */
  sub(vector3: Vector3) {
    return new Vector3(
      this.$x - vector3.$x,
      this.$y - vector3.$y,
      this.$z - vector3.$z,
    )
  }

  /**
   * Returns a new Vector3 corresponding
   * to multiplying each component of this
   * vector by the given `scalar`.
   */
  smul(scalar:number) {
    return new Vector3(
      this.$x * scalar,
      this.$y * scalar,
      this.$z * scalar,
    )
  }

  /**
   * Returns a new Vector3 corresponding
   * to dividing each component of this
   * vector by the given `scalar`. If the
   * `scalar` is `0`, then the value `0.0001`
   * is used.
   */
  sdiv(scalar:number) {
    const k = scalar === 0 ? 0.0001 : scalar;
    return new Vector3(
      this.$x / k,
      this.$y / k,
      this.$z / k,
    )
  }

  /** Returns a new Vector3.  */
  dot(vector3: Vector3) {
    return (
      this.$x * vector3.$x +
      this.$y * vector3.$y +
      this.$z * vector3.$z
    )
  }
}



/** Returns a new 3D vector. */
const v3 = (x: number, y: number, z: number) => (
  new Vector3(x, y, z)
);
