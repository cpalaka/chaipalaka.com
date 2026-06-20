import { Outlet } from 'react-router-dom'
import { BackgroundCanvas } from '../canvas/BackgroundCanvas'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { FrameBar } from '../canvas/FrameBar'
import { StringLayer } from '../canvas/StringLayer'
import { useFrameEdge } from '../canvas/useFrameEdge'
import { CardLayer } from '../card/CardLayer'
import { CardRegistryProvider } from '../card/CardRegistry'
import { RouteAnnouncer } from '../nav/RouteAnnouncer'
import { LadderReset } from '../nav/LadderReset'
import { PortalNav } from '../nav/PortalNav'
import { AtelierGate } from '../atelier/AtelierGate'
import { ContentBox } from '../contentbox/ContentBox'
import { PeekProvider } from '../peek/PeekContext'
import { PeekLayer } from '../peek/PeekLayer'
import { PeekTriggers } from '../peek/PeekTriggers'
import { PinProvider } from '../pin/PinContext'
import { PinLayer } from '../pin/PinLayer'
import './ContentBoxLayout.css'

/**
 * The v2 content-box layout: the three depth planes composed as
 * shader (BackgroundCanvas) / content box (ContentBox, wrapping the route's
 * prose) / foreground cards (CardLayer + StringLayer). Mirrors CanvasLayout's
 * provider stack; the route's prose renders inside the fixed box via the Outlet.
 * Navigation transitions are the v2 hero morph / physical default (ADR-0007) —
 * the retired v1 TransitionDirector is gone.
 */
export default function ContentBoxLayout() {
    const { edge } = useFrameEdge()

    return (
        <PhysicsProvider>
            <CardRegistryProvider>
                <PeekProvider>
                    <PinProvider>
                        <div data-layout="contentbox" data-frame-edge={edge}>
                            <BackgroundCanvas />
                            <ContentBox>
                                <Outlet />
                            </ContentBox>
                            <CardLayer />
                            <PinLayer />
                            <PeekLayer />
                            <StringLayer />
                            <FrameBar />
                            <PeekTriggers />
                            <PortalNav />
                            <AtelierGate />
                            <RouteAnnouncer />
                            <LadderReset />
                        </div>
                    </PinProvider>
                </PeekProvider>
            </CardRegistryProvider>
        </PhysicsProvider>
    )
}
