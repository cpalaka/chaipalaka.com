import './Callout.css'

interface CalloutProps {
  type: 'note' | 'warn' | 'aside'
  children: React.ReactNode
}

export function Callout({ type, children }: CalloutProps) {
  return (
    <aside className={`callout callout--${type}`} role="note">
      {children}
    </aside>
  )
}
