import { Outlet } from 'react-router-dom'
import { AnnouncerProvider } from './announcer'
import './spike.css'

// task-019 spike — standalone layout (no CanvasLayout/WebGL). Holds the
// persistent route announcer so it survives child route swaps.
export default function SpikeLayout() {
    return (
        <AnnouncerProvider>
            <main className="spike-root">
                <Outlet />
            </main>
        </AnnouncerProvider>
    )
}
