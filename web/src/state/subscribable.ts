export interface Subscribable<T> {
    get(): T
    set(next: T): void
    subscribe(listener: (next: T) => void): () => void
}

export function createSubscribable<T>(initial: T): Subscribable<T> {
    let current = initial
    const listeners = new Set<(next: T) => void>()
    return {
        get: () => current,
        set(next) {
            current = next
            for (const l of listeners) l(next)
        },
        subscribe(listener) {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
    }
}
