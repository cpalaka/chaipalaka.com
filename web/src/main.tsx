import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './styles/base.css'

export const createRoot = ViteReactSSG({ routes })
