import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import MeshLine from './MeshLine'
import TransitionLink from './TransitionLink'
import Nav from './Nav'

/*TODO:
 *
 * 2. redo navbar (much later)
 * 3. fix direct route navigation
 * 3. chrome top bar
 *
 * 5. ios safari bottom bar
 */

const ContentContainer = styled.div`
    position: absolute;
    top: 0;

    width: 60vw;
    left: 20vw;

    height: 100%;

    @media (max-width: 1024px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Site = styled.div`
    // height: 100%;
    // width: auto;

    // overflow: scroll;
`

const ThreeContainer = styled.div`
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
`

const PageParent = styled.div`
    position: absolute;
    top: 50px;
`

const SiteTitle = styled(TransitionLink)`
    :hover {
        text-decoration: underline;
        color: ${({ theme }) => theme.colors.primaryAccent};
    }
`

const Layout = ({ children, ...props }) => {
    return (
        <Site>
            <ThreeContainer>
                <MeshLine />
            </ThreeContainer>
            <ContentContainer>
                <Nav {...props} />
                {/* <SiteTitle to='/' from='right'>
                    <h1>chaipalaka</h1>
                </SiteTitle> */}

                <PageParent>{children}</PageParent>
            </ContentContainer>
        </Site>
    )
}

export default Layout
