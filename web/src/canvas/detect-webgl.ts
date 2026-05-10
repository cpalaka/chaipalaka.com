export interface DocumentLike {
    createElement(tag: 'canvas'): { getContext(type: string): unknown }
}

export function detectWebGL(doc: DocumentLike): boolean {
    try {
        const canvas = doc.createElement('canvas')
        return Boolean(
            canvas.getContext('webgl2') || canvas.getContext('webgl'),
        )
    } catch {
        return false
    }
}
