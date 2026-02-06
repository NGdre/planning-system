export abstract class Entity<T = string> {
  protected readonly id: T

  constructor(id: T) {
    this.id = id
  }

  equals(other?: Entity<T>): boolean {
    if (other === null || other === undefined) return false
    if (this === other) return true
    return this.id === other.id
  }
}
