/**
 * Metaball-aura feel constants (task-038 S2). A separate read-at-use module —
 * NEVER folded into `physicsTuning.ts` — for the same reason as `driftTuning.ts`:
 * the Atelier physics axis regenerates `physicsTuning.ts` whole from its zod
 * schema and would silently drop any field the schema doesn't know. The aura is
 * a rendering concern, not a physics one, so it lives here and is read at
 * material-build time (`AuraScene`), where a file edit + Vite reload re-derives
 * the whole shader graph.
 *
 * Values are the prototype's validated defaults (`prototypes/lava-metaball.html`,
 * mercury palette / on-brand). The slice-3 feel pass tunes THIS FILE ONLY — the
 * TSL scene reads every knob from here, so no shader edit is needed to re-feel.
 * Units are viewport CSS px unless noted (the field runs in CSS-px space so it
 * aligns 1:1 with the fixed-position cards regardless of render resolution).
 */
export const auraTuning = {
    /** smin blend radius (px): how eagerly neighbouring card SDFs gloop into one
     *  mercury body. 0 ⇒ no gloop (plain rounded boxes); higher ⇒ merges from
     *  farther apart. Prototype-validated default. Must stay > 0 (baked as a
     *  graph constant; a 0 would divide-by-zero the polynomial smin). */
    blendK: 46,
    /** Aura surface offset (px): the field is thresholded at `d - auraThickness`,
     *  so a card's gloop extends this far beyond its rounded-box edge. */
    auraThickness: 34,
    /** GPU rect-array capacity — matches `PhysicsWorld.snapshotCardRects`'s own
     *  cap (`floor(out.length / 4)`); the pre-allocated bridge buffer is sized
     *  `maxCards * 4`. Cards beyond this are not rendered into the aura. */
    maxCards: 12,
    /** Rounded-box SDF corner radius (px). */
    cornerRadius: 14,
    /** px step for the faked-normal field gradient (central difference). */
    gradientEpsilon: 2,
    /** AC#7 fill-rate control: render the aura framebuffer at this fraction of
     *  the device pixel ratio (0.5 ⇒ half linear resolution ⇒ ¼ fill-rate on a
     *  2× display), floored at `minDpr`. Expressed as a scale so it degrades
     *  gracefully on 1× displays too. Read into the R3F `<Canvas dpr>` at mount. */
    resolutionScale: 0.5,
    minDpr: 0.5,
    /** Fixed key light for the faked-normal shading (prototype `uPal==0`). */
    light: {
        /** Direction (un-normalised; normalised in-shader). */
        direction: [0.4, 0.55, 0.8] as [number, number, number],
        /** Overall light gain (prototype `light` slider default 0.8). */
        intensity: 0.8,
        /** Specular exponent (Blinn-Phong-ish highlight tightness). */
        specPower: 46,
        /** Specular contribution gain. */
        specGain: 0.95,
    },
    /** Mercury body palette + shading mix (prototype `uPal==0`). Raw sRGB
     *  display values, passed through untouched (the scene renders flat +
     *  linear), so these match the prototype's numbers 1:1. Outside the gloop
     *  the layer is transparent — there is no backdrop colour; the blobs
     *  composite over whatever sits beneath the layer. */
    mercury: {
        /** Base grey at the aura's outer edge (depth 0). */
        lo: 0.34,
        /** Base grey at the aura's core (depth 1). */
        hi: 0.66,
        /** Ambient term (unlit floor). */
        ambient: 0.42,
        /** Diffuse term (scaled by N·L and light intensity). */
        diffuse: 0.75,
    },
}

export type AuraTuning = typeof auraTuning
