import type { RouteRecord } from 'vite-react-ssg'
import Home from './routes/Home'

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: Home,
    entry: 'src/routes/Home.tsx',
  },
]
