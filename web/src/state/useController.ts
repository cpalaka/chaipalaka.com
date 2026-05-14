import { useEffect, useState } from 'react'

export interface Controller<T> {
    get(): T
    subscribe(cb: (next: T) => void): () => void
}

export function useController<T>(getInstance: () => Controller<T>): T {
    const ctrl = getInstance()
    const [value, setValue] = useState<T>(() => ctrl.get())
    useEffect(() => ctrl.subscribe(setValue), [ctrl])
    return value
}
