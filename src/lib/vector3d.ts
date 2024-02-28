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

  /**
   * Returns a new Vector3D, whose elements are the result
   * of applying `f` on `(a,b)`, where `a`
   * is an element of this vector,
   * and `b` is some other number.
   */
  binop(f: (a: number, b: number) => number, b: number) {
    const x = f(this.$x, b);
    const y = f(this.$y, b);
    const z = f(this.$z, b);
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
}

/** Returns a new Vector3D. */
export const v3D = (x: number, y: number, z: number) => (
  new Vector3D(x, y, z)
);
