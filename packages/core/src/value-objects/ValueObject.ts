export abstract class ValueObject {
  public equals(other: ValueObject): boolean {
    if (other === null || other === undefined) return false
    if (this.constructor !== other.constructor) return false
    return this.valuesEqual(other)
  }

  protected abstract valuesEqual(other: ValueObject): boolean
}
