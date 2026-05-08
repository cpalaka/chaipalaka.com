import type { RouteRecord } from 'vite-react-ssg'
import Home from './routes/Home'

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Home,
    entry: 'src/routes/Home.tsx',
  },
  {
    path: '/test/canvas',
    lazy: async () => {
      const { default: CanvasLayout } = await import('./layouts/CanvasLayout')
      return { Component: CanvasLayout }
    },
    entry: 'src/layouts/CanvasLayout.tsx',
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: CanvasTest } = await import('./routes/test/Canvas')
          return { Component: CanvasTest }
        },
        entry: 'src/routes/test/Canvas.tsx',
      },
    ],
  },
  {
    path: '/test/plain',
    lazy: async () => {
      const { default: PlainLayout } = await import('./layouts/PlainLayout')
      return { Component: PlainLayout }
    },
    entry: 'src/layouts/PlainLayout.tsx',
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: PlainTest } = await import('./routes/test/Plain')
          return { Component: PlainTest }
        },
        entry: 'src/routes/test/Plain.tsx',
      },
    ],
  },
]
