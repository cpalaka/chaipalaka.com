export function persistentMap(key: string): Map<string, string> {
    const m = new Map<string, string>()
    if (typeof localStorage !== 'undefined') {
        const persisted = localStorage.getItem(key)
        if (persisted) m.set(key, persisted)
        const original = m.set.bind(m)
        m.set = (k, v) => {
            localStorage.setItem(k, v)
            return original(k, v)
        }
    }
    return m
}
