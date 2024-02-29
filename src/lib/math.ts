/**
 * Returns the number between `x` and `y` at the specified increment `a`.
 */
export const lerp = (interval: [number, number], value: number) => (
  interval[0] * (1 - value) + interval[1] * value
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
 * This function, the "inverse lerp", returns the distance
 * between `value` and `lower`, in terms of the
 * percentage (a decimal between 0 and 1, inclusive) of the
 * distance between `lower` and `upper`.
 */
export const ilerp = (interval: [number, number], value: number) => (
  clamp(0, (value - interval[0]) / (interval[1] - interval[0]), 1)
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
    let R = mod(A, B);
    A = B;
    B = R;
  }
  return Math.abs(A);
};

/** A utility method that generates a pseudorandom string. @param length - The max length of the resulting string. @param base - The base from which to draw characters. */
export const uid = (length: number = 4, base = 36) => (
  Math.random()
    .toString(base)
    .replace(/[^a-z]+/g, "")
    .substring(0, length + 1)
);

/** Returns a tuple. */
export const tuple = <T extends any[]>(...data: T) => data;

/** Returns a% of b. */
export const percent = (a: number, b: number) => ((a / 100) * b);

/** Returns true if the given `n` is a JavaScript number. */
export const isJSNum = (x: any): x is number => (
  typeof x === "number" && !Number.isNaN(x)
);

/** Returns true if the given `n` is a JavaScript integer. */
export const isJSInt = (n: any): n is number => (
  typeof n === "number" && (Number.isInteger(n))
);

/** Returns the factorial of the given number. */
export const factorialize = (num: number) => {
  if (num === 0 || num === 1) {
    return 1;
  }
  for (var i = num - 1; i >= 1; i--) {
    num *= i;
  }
  return num;
};

export const sec = (x: number) => (1 / Math.cos(x));
export const csc = (x: number) => (1 / Math.sin(x));

/** Returns true if the given number is even. */
export const isEven = (n: number) => (
  (n % 2) === 0
);

/** Returns true if the given number is odd. */
export const isOdd = (n: number) => (!isEven(n));

/**
 * Where `fraction` corresponds to the rational
 * `n/d`, returns `n/d` in standard form (i.e.,
 * n/d in “simplest” terms). If `d = 0`, returns
 * `fraction`.
 */
export const sfrac = (fraction: [number, number]) => {
  const [n, d] = fraction;
  if (d === 1) {
    return fraction;
  } else if (d === 0) {
    return fraction;
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

/** An object corresponding to a vector in R^3. */
export class Vector3D {
  $x: number;
  $y: number;
  $z: number;
  constructor(x: number, y: number, z: number) {
    this.$x = x;
    this.$y = y;
    this.$z = z;
  }

  zero() {
    return new Vector3D(0, 0, 0);
  }

  /**
   * Returns a new Vector3D, whose elements are the result
   * of applying `f` on `(a,b)`, where `a`
   * is an element of this vector,
   * and `b` is some other number.
   */
  binop(f: (a: number, b: number) => number, other: Vector3D) {
    const x = f(this.$x, other.$x);
    const y = f(this.$y, other.$y);
    const z = f(this.$z, other.$z);
    return new Vector3D(x, y, z);
  }

  /**
   * Returns a new Vector3D,
   * whose elements are the result of applying `f`
   * to each of this vector’s elements.
   */
  unop(f: (n: number) => number) {
    const x = f(this.$x);
    const y = f(this.$y);
    const z = f(this.$z);
    return new Vector3D(x, y, z);
  }

  /**
   * Returns a new Vector3D corresponding
   * to the negation of this vector.
   */
  neg() {
    return this.unop((n) => -n);
  }

  /**
   * Returns the cross product of this vector
   * and the other vector.
   */
  cross(other: Vector3D) {
    const a = this.$x;
    const b = this.$y;
    const c = this.$z;

    const x = other.$x;
    const y = other.$y;
    const z = other.$z;

    const bz = b * z;
    const cy = c * y;
    const cx = c * x;
    const az = a * z;
    const ay = a * y;
    const bx = b * x;

    return (new Vector3D(
      bz - cy,
      cx - az,
      ay - bx,
    ));
  }

  /**
   * Returns the 3D distance between this vector
   * and the provided vector. If this vector
   * or the provided vector are not 3D vectors,
   * an error is returned.
   */
  distance(other: Vector3D) {
    const ax = this.$x;
    const bx = other.$x;
    const bx_ax = bx - ax;

    const ay = this.$y;
    const by = other.$y;
    const by_ay = by - ay;

    const az = this.$z;
    const bz = other.$z;
    const bz_az = bz - az;

    const sum = bx_ax + by_ay + bz_az;
    return Math.sqrt(sum);
  }

  add(other: Vector3D) {
    return this.binop((a, b) => a + b, other);
  }
  sub(other: Vector3D) {
    return this.binop((a, b) => a - b, other);
  }
}

/** Returns a new Vector3D. */
export const v3D = (x: number, y: number, z: number) => (
  new Vector3D(x, y, z)
);
