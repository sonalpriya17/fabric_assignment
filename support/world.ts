export class World {
  private readonly state = new Map<string, unknown>()

  set<T>(key: string, value: T): void {
    this.state.set(key, value)
  }

  get<T>(key: string): T {
    const value = this.state.get(key)
    if (value === undefined) {
      throw new Error(`World key not found: ${key}`)
    }
    return value as T
  }

  has(key: string): boolean {
    return this.state.has(key)
  }
}
