import { Either, left, right } from "./aux";
import { AlgebraError, algebraError } from "./algebraError";

/** An object corresponding to a vector of floating point numbers. */
export class RealVector {
  $elements: number[];
  constructor(elements: number[]) {
    this.$elements = elements;
  }
  /**
   * Assumes this vector has a geometric
   * interpretation, and returns the z-coordinate (the
   * third element of this vector). If no such element
   * exists, returns NaN.
   */
  get z() {
    return this.at(3);
  }
  /**
   * Assumes this vector has a geometric
   * interpretation, and returns the y-coordinate (the
   * second element of this vector). If no such element
   * exists, returns NaN.
   */
  get y() {
    return this.at(2);
  }
  /**
   * Assumes this vector has a geometric
   * interpretation, and returns the x-coordinate (the
   * first element of this vector). If no such element
   * exists, returns NaN.
   */
  get x() {
    return this.at(1);
  }
  /**
   * Returns this RealVector as a 1 x n matrix,
   * where `n` is the length of this vector. I.e.,
   * returns this RealVector as a row vector,
   * which is a 1 x n matrix.
   */
  rowVector() {
    return rowVector(this.$elements);
  }
  /**
   * Returns either an error or a RealMatrix,
   * corresponding to the matrix-vector multiplication
   * of this vector and the provided matrix.
   */
  /*
  mmul(matrix: RealMatrix | (number[])[]) {
    matrix = (Array.isArray(matrix)) ? (mtx(matrix)) : matrix;
    return matrix.mmul(this.rowVector());
  }
	*/
  /** Returns a string representation of this RealVector. */
  toString() {
    let out = "[";
    for (let i = 0; i < this.$elements.length; i++) {
      out += `${this.$elements[i]}`;
      if (i !== this.$elements.length - 1) {
        out += ",";
      }
    }
    out += "]";
    return out;
  }
  /** Returns the number of elements of this RealVector. */
  get length() {
    return this.$elements.length;
  }
  /**
   * Returns the element at the given index.
   * Note that indices start at 1.
   */
  at(index: number): number {
    const out = this.$elements[index - 1];
    return out === undefined ? NaN : out;
  }
  /**
   * Returns a new RealVector, of the same length,
   * whose elements are the result of applying `f`
   * to this RealVector’s elements.
   */
  unaryOp(f: (n: number) => number) {
    const out = [];
    for (let i = 0; i < out.length; i++) {
      out.push(f(this.$elements[i]));
    }
    return new RealVector(out);
  }
  /**
   * Returns a new RealVector, of the same length,
   * whose elements are the result of applying `f`
   * on `(a,b)`, where `a` is an element of this vector,
   * and `b` is some other number.
   */
  binaryOp(f: (a: number, b: number) => number, b: number) {
    const out = [];
    for (let i = 0; i < this.length; i++) {
      out.push(f(this.$elements[i], b));
    }
    return new RealVector(out);
  }
  /**
   * Returns a new RealVector corresponding to
   * the negation of this vector.
   */
  neg() {
    return this.unaryOp((n) => -n);
  }
  /**
   * Returns the 2D distance between this vector
   * and the provided vector. If this vector
   * or the provided vector are not 2D vectors,
   * an error is returned.
   */
  /*
  dist2D(other: RealVector): Either<AlgebraError, number> {
    if (this.length !== 2 || other.length !== 2) {
      return left(algebraError(
        `dist2D is only defined on RealVectors of length 2`,
        `call:dist3D`,
      ));
    } else {
      const ax = this.$elements[0];
      const bx = other.$elements[0];
      const bx_ax = bx - ax;

      const ay = this.$elements[1];
      const by = other.$elements[1];
      const by_ay = by - ay;

      const sum = bx_ax + by_ay;
      return right(sqrt(sum));
    }
  }
	*/
  /**
   * Returns the cross product of this vector and
   * the other vector. If this vector is not
   * of length 3, an error is returned, since
   * the cross product is only defined on 3D vectors.
   */
  /*
  cross(other: RealVector): Either<AlgebraError, RealVector> {
    if (this.length !== 3 || other.length !== 3) {
      return left(algebraError(
        `cross (cross product) is only defined on RealVectors of length 3`,
        `call:cross`,
      ));
    } else {
      const a = this.$elements[0];
      const b = this.$elements[1];
      const c = this.$elements[2];

      const x = other.$elements[0];
      const y = other.$elements[1];
      const z = other.$elements[2];

      const bz = b * z;
      const cy = c * y;
      const cx = c * x;
      const az = a * z;
      const ay = a * y;
      const bx = b * x;

      return right(
        new RealVector([
          bz - cy,
          cx - az,
          ay - bx,
        ]),
      );
    }
  }
	*/
  /**
   * Returns the 3D distance between this vector
   * and the provided vector. If this vector
   * or the provided vector are not 3D vectors,
   * an error is returned.
   */
  /*
  dist3D(other: RealVector): Either<AlgebraError, number> {
    if (this.length !== 3 || other.length !== 3) {
      return left(algebraError(
        `dist3D is only defined on RealVectors of length 3`,
        `call:dist3D`,
      ));
    } else {
      const ax = this.$elements[0];
      const bx = other.$elements[0];
      const bx_ax = bx - ax;

      const ay = this.$elements[1];
      const by = other.$elements[1];
      const by_ay = by - ay;

      const az = this.$elements[2];
      const bz = other.$elements[2];
      const bz_az = bz - az;

      const sum = bx_ax + by_ay + bz_az;
      return right(sqrt(sum));
    }
  }
	*/
  /**
   * Returns the dot product of this vector and the provided vector.
   * If this vector and the other vector are not of the same length,
   * then an error is returned.
   */
  /*
  dot(other: RealVector): Either<AlgebraError, number> {
    if (other.length !== this.length) {
      return left(algebraError(
        `dot (dot product) is only defined on RealVectors of the same length`,
        `call:dot`,
      ));
    } else {
      let out = 0;
      for (let i = 0; i < this.length; i++) {
        const a = this.$elements[i];
        const b = other.$elements[i];
        const ab = a * b;
        out += ab;
      }
      return right(out);
    }
  }
	*/
  /**
   * Returns the difference of this vector and the given vector.
   * If the vector passed is not of the same length as this
   * vector, an error is returned.
   */
  /*
  vsub(other: RealVector): Either<AlgebraError, RealVector> {
    if (other.length !== this.length) {
      return left(algebraError(
        `vsub (vector-vector subtraction) is only defined on RealVectors of the same length`,
        `call:vsub`,
      ));
    } else {
      let out = [];
      for (let i = 0; i < this.length; i++) {
        const a = this.$elements[i];
        const b = other.$elements[i];
        out.push(a - b);
      }
      return right(new RealVector(out));
    }
  }
	*/
  /**
   * Returns the sum of this vector and the given vector.
   * If the vector passed is not of the same length as this
   * vector, an error is returned.
   */
  /*
  vadd(other: RealVector): Either<AlgebraError, RealVector> {
    if (other.length !== this.length) {
      return left(algebraError(
        `vadd (vector-vector addition) is only defined on RealVectors of the same length`,
        `call:vadd`,
      ));
    } else {
      let out = [];
      for (let i = 0; i < this.length; i++) {
        const a = this.$elements[i];
        const b = other.$elements[i];
        out.push(a + b);
      }
      return right(new RealVector(out));
    }
  }
	*/
  /**
   * Returns a new RealVector whose elements
   * are the result of subtracting the given
   * scalar `s` and the corresponding
   * element in this vector.
   */
  sdif(s: number): RealVector {
    return this.binaryOp((a, b) => a - b, s);
  }
  /**
   * Returns a new RealVector whose elements
   * are the result of adding the given
   * scalar `s` and the corresponding
   * element in this vector.
   */
  sadd(s: number): RealVector {
    return this.binaryOp((a, b) => a + b, s);
  }
  /**
   * Returns a new RealVector corresponding to the
   * product of `s`, a scalar, and
   * this vector.
   */
  smul(s: number): RealVector {
    return this.binaryOp((a, b) => a * b, s);
  }
  /**
   * Returns a new RealVector corresponding to the
   * scalar division of `k`, a scalar, and this vector.
   * Note that if `k = 0`, then the optional argument `d` is passed
   * as a replacement. By default, `d = 0.00001`.
   */
  sdiv(k: number, d: number = 0.00001): RealVector {
    return this.binaryOp((a, b) => a / b, k === 0 ? d : k);
  }
  /**
   * Returns the magnitude of this vector.
   */
  mag(): number {
    let out = 0;
    for (let i = 0; i < this.$elements.length; i++) {
      out += (this.$elements[i]) ** 2;
    }
    return Math.sqrt(out);
  }
  /**
   * Returns the norm of this vector.
   */
  norm(): RealVector {
    const mag = this.mag();
    return this.sdiv(mag);
  }
}

/** Returns a new vector. */
export const rvector = (elements: number[]) => (
  new RealVector(elements)
);

/**
 * Returns true, and asserts,
 * if the given `x` is a vector.
 */
export const isRealVector = (x: any): x is RealVector => (
  x instanceof RealVector
);

/**
 * An object corresponding to a matrix.
 */
export class RealMatrix {
  $vectors: RealVector[];
  $rows: number;
  $columns: number;
  constructor(vectors: RealVector[]) {
    this.$vectors = vectors;
    this.$rows = vectors.length;
    this.$columns = vectors[0].length;
  }
  /** Returns a string representation of this RealMatrix. */
  toString() {
    let out = "[";
    for (let i = 0; i < this.$rows; i++) {
      out += this.$vectors[i].toString();
      if (i !== this.$rows - 1) {
        out += "\n";
      }
    }
    out += "]";
    return out;
  }
  /**
   * Returns a new RealMatrix whose elements
   * are the result of applying the given function
   * `f` to each element of this matrix.
   */
  unop(f: (x: number) => number) {
    const elements: RealVector[] = [];
    for (let i = 0; i < this.$rows; i++) {
      const v: number[] = [];
      for (let j = 0; j < this.$columns; j++) {
        v.push(f(this.$vectors[i].$elements[j]));
      }
      elements.push(new RealVector(v));
    }
    return new RealMatrix(elements);
  }
  /**
   * Returns either an error or a new RealVector
   * whose elements are the dot product of
   * each element of `v` with each row of this
   * matrix. If the number of columns of this matrix
   * is not equal to the length of `v`, then
   * an error is returned.
   */
  /*
  vmul(v: RealMatrix | number[]): Either<AlgebraError, RealVector> {
    v = Array.isArray(v) ? rowVector(v) : v;
    if (this.$columns !== v.length) {
      return left(algebraError(
        `Given a matrix M and a vector v, M * v is only defined if the number of columns of M equals the length of v.`,
        `call:vmul`,
      ));
    } else {
      const out = [];
      for (let i = 0; i < this.$rows; i++) {
        let sum = 0;
        const other = this.$vectors[i];
        for (let j = 0; j < v.length; j++) {
          const a = v.$vectors[j].$elements[0];
          const b = other.$elements[j];
          const ab = a * b;
          sum += ab;
        }
        out.push(sum);
      }
      return right(new RealVector(out));
    }
  }
	*/
  /**
   * Returns either an error or a matrix-by-matrix
   * of this matrix and the given matrix.
   */
  /*
  mmul(other: RealMatrix): Either<AlgebraError, RealMatrix> {
    if (this.$columns !== other.$rows) {
      return left(algebraError(
        `Given a matrix A and a matrix B, matrix-by-matrix multiplication is only defined if the number of columns of A is equal to the number of columns of B.`,
        `call:mmul`,
      ));
    } else {
      const result: (number[])[] = [];
      for (let i = 0; i < this.$rows; i++) {
        result[i] = [];
        for (let j = 0; j < other.$columns; j++) {
          let sum = 0;
          for (let k = 0; k < this.$columns; k++) {
            const e_ik = this.$vectors[i].$elements[k];
            const e_kj = other.$vectors[k].$elements[j];
            sum += e_ik * e_kj;
          }
          result[i][j] = sum;
        }
      }
      return right(new RealMatrix(result.map((r) => new RealVector(r))));
    }
  }
	*/
  /**
   * Returns a new RealMatrix whose elements
   * are the result of negating every element
   * of this matrix.
   */
  neg() {
    return this.unop((x) => -x);
  }
  /**
   * Returns a new RealMatrix whose
   * elements are the result of dividing
   * the given scalar `s` to each element
   * of this matrix.
   *
   * If `s = 0`, then the optional argument
   * `d` is used (defaulting to 0.00001).
   */
  sdiv(s: number, d: number = 0.00001) {
    const mtx: RealVector[] = [];
    for (let i = 0; i < this.$rows; i++) {
      const row = this.$vectors[i];
      mtx.push(row.sdiv(s, d));
    }
    return new RealMatrix(mtx);
  }
  /**
   * Returns a new RealMatrix whose
   * elements are the result of subtracting
   * the given scalar `s` to each element
   * of this matrix.
   */
  sdif(s: number) {
    const mtx: RealVector[] = [];
    for (let i = 0; i < this.$rows; i++) {
      const row = this.$vectors[i];
      mtx.push(row.sdif(s));
    }
    return new RealMatrix(mtx);
  }
  /**
   * Returns a new RealMatrix whose
   * elements are the result of adding
   * the given scalar `s` to each element
   * of this matrix.
   */
  sadd(s: number) {
    const mtx: RealVector[] = [];
    for (let i = 0; i < this.$rows; i++) {
      const row = this.$vectors[i];
      mtx.push(row.sadd(s));
    }
    return new RealMatrix(mtx);
  }
  /**
   * Returns a new RealMatrix whose
   * elements are the result of multiplying
   * the given scalar `s` to each element
   * of this matrix.
   */
  smul(s: number) {
    const mtx: RealVector[] = [];
    for (let i = 0; i < this.$rows; i++) {
      const row = this.$vectors[i];
      mtx.push(row.smul(s));
    }
    return new RealMatrix(mtx);
  }
  /**
   * Calls the given callback for each element of this matrix.
   * The callback is a function that takes three parameters:
   * 1. `element` - The current matrix element.
   * 2. `rowIndex` - The current rowIndex (starting at 1).
   * 3. `columnIndex` - The current columnIndex (starting at 1).
   */
  forEach<K>(f: (element: number, rowIndex: number, columnIndex: number) => K) {
    for (let i = 0; i < this.$rows; i++) {
      for (let j = 0; j < this.$columns; j++) {
        f(this.$vectors[i].$elements[j], i + 1, j + 1);
      }
    }
  }
  /**
   * Returns either the diagonal of this matrix
   * (an array of numbers) or an error. If this
   * matrix is not a square matrix, then an
   * error is returned.
   */
  /*
  diagonal() {
    if (!this.isSquare) {
      return left(algebraError(
        `Matrix diagonals are only defined on square matrices`,
        `call:diagonal`,
      ));
    } else {
      const out: number[] = [];
      this.forEach((e, r, i) => {
        if (r === i) {
          out.push(e);
        }
      });
      return right(out);
    }
  }
	*/
  /**
   * Returns a new RealMatrix corresponding
   * to the transpose of this RealMatrix.
   */
  transpose() {
    const r = this.$rows;
    const c = this.$columns;
    if (r === 0 || c === 0) {
      return new RealMatrix([]);
    }
    let t: (number[])[] = [];
    for (let i = 0; i < c; i++) {
      t[i] = [];
      for (let j = 0; j < r; j++) {
        t[i][j] = this.$vectors[j].$elements[i];
      }
    }
    const rows: RealVector[] = [];
    t.forEach((v) => rows.push(new RealVector(v)));
    return new RealMatrix(rows);
  }
  /**
   * True if and only if this RealMatrix is a square
   * matrix (the number of rows is equal to the number)
   * of columns.
   */
  get isSquare() {
    return this.$rows === this.$columns;
  }
  /**
   * Returns the number of rows of this RealMatrix.
   */
  get length() {
    return this.$rows;
  }
  /**
   * Returns the row at the given index.
   * Note that indices start at 1.
   */
  row(index: number) {
    return this.$vectors[index - 1];
  }
}

/**
 * Returns either a new RealMatrix or an AlgebraError.
 * If the vectors passed vary in length, then an
 * error is returned.
 */
export const rmatrix = (
  vectors: RealVector[],
): Either<AlgebraError, RealMatrix> => {
  const columnCount = vectors[0].length;
  for (let i = 1; i < vectors.length; i++) {
    if (vectors[i].length !== columnCount) {
      return left(
        algebraError(
          `Jagged matrix encountered`,
          `call:rmatrix`,
        ),
      );
    }
  }
  return right(new RealMatrix(vectors));
};

/**
 * Returns either a new RealMatrix. This function
 * performs no error handling. The column count
 * is assumed to be the length of the first row.
 * If a subsequent row `r_i` differs in length, then:
 *
 * 1. If the length of `r_i` is less than the initial
 * column count, then a 0 is inserted.
 * 2. If the length of `r_i` is greater than the initial
 * column count, then the element is omitted.
 */
const mtx = (rows: (number[])[]) => {
  const vectors = [];
  for (let i = 0; i < rows.length; i++) {
    let row: number[] = [];
    const r = rows[i];
    for (let j = 0; j < r.length; j++) {
      const e = rows[i][j];
      if (e === undefined) {
        row.push(0);
      } else {
        row.push(e);
      }
    }
    vectors.push(rvector(row));
  }
  return new RealMatrix(vectors);
};

/**
 * Returns true, and asserts,
 * if x is a matrix.
 */
export const isRealMatrix = (x: any): x is RealMatrix => (
  x instanceof RealMatrix
);

/**
 * Returns a new `1 x m` RealMatrix,
 * where `m` is the length of the given
 * array of numbers. Mathematically, this corresponds to
 * a row vector.
 */
const rowVector = (elements: number[]) => {
  const out: RealVector[] = [];
  for (let i = 0; i < elements.length; i++) {
    out.push(rvector([elements[i]]));
  }
  return new RealMatrix(out);
};
