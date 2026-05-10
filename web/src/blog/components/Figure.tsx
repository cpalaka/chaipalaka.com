interface FigureProps {
    src: string
    caption: string
    credit?: string
    alt?: string
}

export function Figure({ src, caption, credit, alt }: FigureProps) {
    return (
        <figure>
            <img src={src} alt={alt ?? caption} loading="lazy" />
            <figcaption>
                {caption}
                {credit && <span className="figure-credit"> — {credit}</span>}
            </figcaption>
        </figure>
    )
}
