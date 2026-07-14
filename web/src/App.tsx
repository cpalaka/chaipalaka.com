import type { RouteRecord } from 'vite-react-ssg'

export const routes: RouteRecord[] = [
    {
        // Home is a v2 content-box route now (populated landing) — task-026.
        path: '/',
        lazy: async () => {
            const { default: ContentBoxLayout } =
                await import('./layouts/ContentBoxLayout')
            return { Component: ContentBoxLayout }
        },
        entry: 'src/layouts/ContentBoxLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: Home } = await import('./routes/Home')
                    return { Component: Home }
                },
                entry: 'src/routes/Home.tsx',
            },
        ],
    },
    {
        path: '/test/canvas',
        lazy: async () => {
            const { default: CanvasLayout } =
                await import('./layouts/CanvasLayout')
            return { Component: CanvasLayout }
        },
        entry: 'src/layouts/CanvasLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: CanvasTest } =
                        await import('./routes/test/Canvas')
                    return { Component: CanvasTest }
                },
                entry: 'src/routes/test/Canvas.tsx',
            },
        ],
    },
    {
        path: '/test/plain',
        lazy: async () => {
            const { default: PlainLayout } =
                await import('./layouts/PlainLayout')
            return { Component: PlainLayout }
        },
        entry: 'src/layouts/PlainLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: PlainTest } =
                        await import('./routes/test/Plain')
                    return { Component: PlainTest }
                },
                entry: 'src/routes/test/Plain.tsx',
            },
        ],
    },
    {
        path: '/test/box',
        lazy: async () => {
            const { default: ContentBoxLayout } =
                await import('./layouts/ContentBoxLayout')
            return { Component: ContentBoxLayout }
        },
        entry: 'src/layouts/ContentBoxLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: BoxTest } =
                        await import('./routes/test/Box')
                    return { Component: BoxTest }
                },
                entry: 'src/routes/test/Box.tsx',
            },
        ],
    },
    {
        path: '/lifelog',
        lazy: async () => {
            const { default: CanvasLayout } =
                await import('./layouts/CanvasLayout')
            return { Component: CanvasLayout }
        },
        entry: 'src/layouts/CanvasLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: Lifelog } =
                        await import('./routes/Lifelog')
                    return { Component: Lifelog }
                },
                entry: 'src/routes/Lifelog.tsx',
            },
        ],
    },
    {
        // Box-less drift toy for the task-038 SDF metaball card auras — mounts
        // AuraLayer over 12 detached, full-drift cards (resolves AC#6: no content
        // box to occlude the aura field).
        path: '/lab',
        lazy: async () => {
            const { default: CanvasLayout } =
                await import('./layouts/CanvasLayout')
            return { Component: CanvasLayout }
        },
        entry: 'src/layouts/CanvasLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: Lab } = await import('./routes/Lab')
                    return { Component: Lab }
                },
                entry: 'src/routes/Lab.tsx',
            },
        ],
    },
    {
        path: '/stuff',
        lazy: async () => {
            const { default: CanvasLayout } =
                await import('./layouts/CanvasLayout')
            return { Component: CanvasLayout }
        },
        entry: 'src/layouts/CanvasLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: Stuff } =
                        await import('./routes/Stuff')
                    return { Component: Stuff }
                },
                entry: 'src/routes/Stuff.tsx',
            },
            {
                path: 'flash',
                lazy: async () => {
                    const { default: Flash } =
                        await import('./routes/stuff/Flash')
                    return { Component: Flash }
                },
                entry: 'src/routes/stuff/Flash.tsx',
            },
            {
                path: 'flash/:slug',
                lazy: async () => {
                    const { default: FlashDetail } =
                        await import('./routes/stuff/FlashDetail')
                    return { Component: FlashDetail }
                },
                entry: 'src/routes/stuff/FlashDetail.tsx',
            },
        ],
    },
    {
        // /blog is a v2 content-box route now (task-026): a quiet listing at the
        // index, each post a content-box reading surface at :slug. The single-card
        // BlogPost is retired; /blog/:slug renders the same BlogPostReader as the
        // /read floor, but inside the box with the link ladder.
        path: '/blog',
        lazy: async () => {
            const { default: ContentBoxLayout } =
                await import('./layouts/ContentBoxLayout')
            return { Component: ContentBoxLayout }
        },
        entry: 'src/layouts/ContentBoxLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: BlogIndex } =
                        await import('./routes/blog/BlogIndex')
                    return { Component: BlogIndex }
                },
                entry: 'src/routes/blog/BlogIndex.tsx',
            },
            {
                path: ':slug',
                lazy: async () => {
                    const { default: BlogPostReader } =
                        await import('./routes/blog/BlogPostReader')
                    return { Component: BlogPostReader }
                },
                entry: 'src/routes/blog/BlogPostReader.tsx',
            },
        ],
    },
    {
        path: '/sandbox/cards',
        lazy: async () => {
            const { default: Cards } = await import('./routes/sandbox/Cards')
            return { Component: Cards }
        },
    },
    {
        path: '/sandbox/scenes/:id',
        lazy: async () => {
            const { default: SandboxScene } = await import(
                './routes/sandbox/Scene'
            )
            return { Component: SandboxScene }
        },
    },
    {
        // Second content-box route — the hero-morph destination demoed against
        // /test/box (a Portal card there morphs into this box). The /blog rollout
        // onto the content box is task-026.
        path: '/test/box-b',
        lazy: async () => {
            const { default: ContentBoxLayout } =
                await import('./layouts/ContentBoxLayout')
            return { Component: ContentBoxLayout }
        },
        entry: 'src/layouts/ContentBoxLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: BoxB } = await import('./routes/test/BoxB')
                    return { Component: BoxB }
                },
                entry: 'src/routes/test/BoxB.tsx',
            },
        ],
    },
    {
        path: '/blog/:slug/read',
        lazy: async () => {
            const { default: PlainLayout } =
                await import('./layouts/PlainLayout')
            return { Component: PlainLayout }
        },
        entry: 'src/layouts/PlainLayout.tsx',
        children: [
            {
                index: true,
                lazy: async () => {
                    const { default: BlogPostReader } =
                        await import('./routes/blog/BlogPostReader')
                    return { Component: BlogPostReader }
                },
                entry: 'src/routes/blog/BlogPostReader.tsx',
            },
        ],
    },
    {
        // 404 stays bespoke under the canvas layout — a pathless layout route
        // whose splat child catches every URL no other route matched. (Home
        // moved off CanvasLayout to the content box, so the catch-all needed its
        // own layout parent.)
        lazy: async () => {
            const { default: CanvasLayout } =
                await import('./layouts/CanvasLayout')
            return { Component: CanvasLayout }
        },
        entry: 'src/layouts/CanvasLayout.tsx',
        children: [
            {
                path: '*',
                lazy: async () => {
                    const { default: NotFound } =
                        await import('./routes/NotFound')
                    return { Component: NotFound }
                },
            },
        ],
    },
]
