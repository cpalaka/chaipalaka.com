interface VideoProps {
  src: string
  caption?: string
}

export function Video({ src, caption }: VideoProps) {
  return (
    <figure>
      <video src={src} controls style={{ width: '100%' }} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
