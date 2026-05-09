import { PhysicsCard } from '../physics/PhysicsCard'

export default function Home() {
  return (
    <>
      <main>
        <h1>chaipalaka.com</h1>
        <p>
          Personal site of Chai Palaka — a physics-driven, generative-art-backed
          home on the internet that doubles as a portfolio of frontend craft.
        </p>
        <p>
          This page is still a placeholder. It exercises the typographic baseline
          shipped in slice&nbsp;3 — Newsreader for body text, JetBrains Mono for
          code, design tokens defined as CSS custom properties so the site can
          be re-skinned by editing one stylesheet. The canvas, the physics, and
          the actual content land in later slices.
        </p>

        <hr />

        <h2>What's coming</h2>
        <p>
          The eventual site has two layout shells: a canvas-mode shell with a
          persistent R3F background and matter.js-driven foreground cards, and a
          plain-mode shell for long-form reading. Routes include <code>/blog</code>,{' '}
          <code>/portfolio</code>, <code>/lifelog</code>, and a 404 in playground
          mode with gravity on. See <code>PRD.md</code> in the repo for the full
          design.
        </p>
        <p>
          Source: <a href="https://github.com/cpalaka/chaipalaka.com">github.com/cpalaka/chaipalaka.com</a>.
        </p>

        <blockquote>
          <p>
            The site must succeed on three axes simultaneously: aesthetic identity,
            content utility, and graceful degradation — and each axis tends to pull
            against the others.
          </p>
        </blockquote>
      </main>
      <PhysicsCard
        text="drag me — i spring back. slice 5 lands the physics primitive."
        fontKey="body"
        maxWidth={280}
        anchor={{ x: typeof window !== 'undefined' ? window.innerWidth - 220 : 800, y: 220 }}
      />
    </>
  )
}
