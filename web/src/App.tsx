import type { RouteRecord } from 'vite-react-ssg'

export const routes: RouteRecord[] = [
    {
        path: '/',
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
                    const { default: Home } = await import('./routes/Home')
                    return { Component: Home }
                },
                entry: 'src/routes/Home.tsx',
            },
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
        path: '/blog',
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
                    const { default: BlogIndex } =
                        await import('./routes/blog/BlogIndex')
                    return { Component: BlogIndex }
                },
                entry: 'src/routes/blog/BlogIndex.tsx',
            },
            {
                path: ':slug',
                lazy: async () => {
                    const { default: BlogPost } =
                        await import('./routes/blog/BlogPost')
                    return { Component: BlogPost }
                },
                entry: 'src/routes/blog/BlogPost.tsx',
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
        path: '/sandbox/strings',
        lazy: async () => {
            const { default: Strings } = await import('./routes/sandbox/Strings')
            return { Component: Strings }
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
]
