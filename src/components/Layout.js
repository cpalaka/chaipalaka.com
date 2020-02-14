import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'

/*TODO:
 *
 * 2. fix subnav scroll bar
 * 3. chrome top bar
 * 
 * 5. ios safari bottom bar
 */

const ContentContainer = styled.div`
    position: absolute;

    width: 50vw;
    left: 25vw;

    height: ${props => (props.isWindows ? '99vh' : '100vh')};

    top: 0;

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    border-left: 1px solid rgba(50, 115, 220, 0.3);
    border-right: 1px solid rgba(50, 115, 220, 0.3);
    border-bottom: 10px solid ${({ theme }) => theme.colors.primaryAccent};
    box-sizing: border-box;

    @media (max-width: 1024px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Site = styled.div`
    height: ${props => (props.isWindows ? '99vh' : '100vh')};
    width: ${props => (props.isWindows ? '99vw' : '100vw')};

    overflow: hidden;
`

const SiteTitle = styled(TransitionLink)`
// height: 5vh;
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.primaryAccent};
    }
`

const Layout = ({ children, ...props }) => {
    //remove scroll bars on windows by (horizonatal atleast) by lowering site height
    const [isWindows, setIsWindows] = useState(false)
    useEffect(() => {
        if (typeof window !== `undefined`) {
            setIsWindows(window.navigator.appVersion.indexOf('Win') != -1)
        }
    })

    return (
        <Site isWindows={isWindows}>
            <MeshLine />
            <ContentContainer isWindows={isWindows}>
                <SiteTitle to='/' from='right'>
                    <h1>chaipalaka</h1>
                </SiteTitle>

                {children}

                <Nav {...props} />
            </ContentContainer>
        </Site>
    )
}

export default Layout
