import { Outlet } from 'react-router-dom'
import { BackgroundCanvas } from '../canvas/BackgroundCanvas'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { FrameBar } from '../canvas/FrameBar'
import { StringLayer } from '../canvas/StringLayer'
import { useFrameEdge } from '../canvas/useFrameEdge'
import { TransitionDirector } from '../transitions/TransitionDirector'
import { CardLayer } from '../card/CardLayer'
import { CardRegistryProvider } from '../card/CardRegistry'
import { PageDefRegistryProvider } from '../transitions/PageDefRegistry'
import { pageDefs } from '../routes/pageDefs'
import { edges } from '../transitions/transitionOverrides'
import { AtelierGate } from '../atelier/AtelierGate'
import { ContentBox } from '../contentbox/ContentBox'
import { PeekProvider } from '../peek/PeekContext'
import { PeekLayer } from '../peek/PeekLayer'
import { PeekTriggers } from '../peek/PeekTriggers'
import './ContentBoxLayout.css'

/**
 * The v2 content-box layout: the three depth planes composed as
 * shader (BackgroundCanvas) / content box (ContentBox, wrapping the route's
 * prose) / foreground cards (CardLayer + StringLayer). Mirrors CanvasLayout's
 * provider stack; the route's prose renders inside the fixed box via the Outlet.
 * (The v1 TransitionDirector is reused as-is for now; slice 6 retires it.)
 */
export default function ContentBoxLayout() {
    const { edge } = useFrameEdge()

    return (
        <PhysicsProvider>
            <CardRegistryProvider>
                <PageDefRegistryProvider>
                    <TransitionDirector pageDefs={pageDefs} edges={edges}>
                        <PeekProvider>
                            <div data-layout="contentbox" data-frame-edge={edge}>
                                <BackgroundCanvas />
                                <ContentBox>
                                    <Outlet />
                                </ContentBox>
                                <CardLayer />
                                <PeekLayer />
                                <StringLayer />
                                <FrameBar />
                                <PeekTriggers />
                                <AtelierGate />
                            </div>
                        </PeekProvider>
                    </TransitionDirector>
                </PageDefRegistryProvider>
            </CardRegistryProvider>
        </PhysicsProvider>
    )
}
